import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Decodes a JWT payload WITHOUT verifying the signature. This is safe here
 * because we only ever read claims from the token Supabase's own
 * @supabase/ssr session helper just validated/refreshed for us via GoTrue;
 * we are not using this to authenticate the request, only to branch UI/
 * routing logic on claims that are already trustworthy at this point.
 */
function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = Buffer.from(padded, "base64").toString("utf-8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Resolves which tenant a request belongs to.
 *
 * Production intent (per the design doc): subdomain-based, e.g.
 *   masjid-noor.iciapp.com -> slug "masjid-noor"
 *
 * Local dev / no-custom-domain fallback: a path segment, e.g.
 *   /t/masjid-noor/admin/... -> slug "masjid-noor"
 *
 * Either way, this ONLY extracts the slug from the URL. It does NOT by
 * itself decide whether the current user is allowed into that tenant —
 * that check happens further down by comparing against the session's
 * own tenant_id claim.
 */
function resolveTenantSlugFromRequest(request: NextRequest): string | null {
  const host = request.headers.get("host") || "";
  const baseDomain = process.env.NEXT_PUBLIC_APP_BASE_DOMAIN || "";

  if (baseDomain && host.endsWith(`.${baseDomain}`)) {
    const subdomain = host.slice(0, host.length - baseDomain.length - 1);
    if (subdomain && subdomain !== "www" && subdomain !== "admin") {
      return subdomain;
    }
  }

  const match = request.nextUrl.pathname.match(/^\/t\/([^/]+)/);
  if (match) {
    return match[1];
  }

  return null;
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // Refreshes the session if it's expired, and syncs the (possibly rotated)
  // auth cookies onto `response`. This is the standard Supabase SSR pattern —
  // required so server components/route handlers see a valid session.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const claims = session ? decodeJwtPayload(session.access_token) : null;
  const sessionTenantId: string | undefined = claims?.tenant_id;
  const isPlatformAdmin: boolean = Boolean(claims?.is_platform_admin);

  const { pathname } = request.nextUrl;
  const requestedSlug = resolveTenantSlugFromRequest(request);

  // ── super_admin routes: /platform-admin/** ──
  // Only platform_admins (cross-tenant staff) may ever reach these, regardless
  // of which tenant (if any) is in the URL. Everyone else — including a
  // perfectly legitimate, currently-logged-in tenant_admin — is redirected
  // away. The login page itself is exempted (otherwise nobody could ever
  // reach it to sign in as a platform admin in the first place).
  if (pathname.startsWith("/platform-admin")) {
    if (pathname === "/platform-admin/login") {
      return response;
    }

    if (!session || !isPlatformAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/platform-admin/login";
      url.searchParams.set("reason", "platform_admin_required");
      return NextResponse.redirect(url);
    }
    return response;
  }


  // ── institute_admin routes: /t/[slug]/admin/** ──
  // A logged-in tenant admin may only ever reach the admin area for the
  // tenant recorded against THEIR OWN account (session's tenant_id claim),
  // never another tenant's slug, even if they type/guess the URL directly.
  if (pathname.match(/^\/t\/[^/]+\/admin/)) {
    if (!session || !sessionTenantId) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("reason", "auth_required");
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    // Look up the tenant row for the slug in the URL and compare its id
    // against the session's own tenant_id — this is what stops
    // /t/tenant-a/admin from ever being reachable using tenant B's session,
    // independent of whatever RLS would separately do to the data itself.
    // Uses the narrow get_tenant_by_slug() RPC (not a raw table select),
    // since the `tenants` table itself grants nothing to anon/authenticated.
    const { data: tenantRows } = await supabase.rpc("get_tenant_by_slug", {
      p_slug: requestedSlug,
    });
    const tenantRow = tenantRows?.[0];

    if (!tenantRow || tenantRow.id !== sessionTenantId) {
      const url = request.nextUrl.clone();
      url.pathname = "/unauthorized";
      return NextResponse.redirect(url);
    }

    // Propagate the resolved tenant to downstream Server Components / Route
    // Handlers via a request header, so they don't need to re-parse the URL.
    response.headers.set("x-tenant-id", tenantRow.id);
    response.headers.set("x-tenant-slug", tenantRow.slug);
    return response;
  }

  // ── Public PWA routes: /t/[slug]/** (non-admin) ──
  // Anonymous visitors are allowed; we just resolve+attach the tenant so
  // downstream anon-role Supabase queries can filter by it via RLS.
  if (requestedSlug) {
    const { data: tenantRows } = await supabase.rpc("get_tenant_by_slug", {
      p_slug: requestedSlug,
    });
    const tenantRow = tenantRows?.[0];

    if (tenantRow) {
      response.headers.set("x-tenant-id", tenantRow.id);
      response.headers.set("x-tenant-slug", tenantRow.slug);
    }
  }


  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
