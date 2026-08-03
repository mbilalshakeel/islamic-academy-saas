import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export class TenantAdminAuthError extends Error {}

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    return JSON.parse(Buffer.from(padded, "base64").toString("utf-8"));
  } catch {
    return null;
  }
}

/**
 * Guard for /api/tenant-admin/* routes: requires a logged-in session whose
 * JWT carries a tenant_id claim (i.e. an institute_admin, not a platform
 * admin and not an anonymous PWA visitor). Returns that tenant_id alongside
 * the anon-key Supabase client — NOTE this client is still subject to RLS
 * as normal; nothing here bypasses tenant isolation, it only identifies
 * which tenant the caller belongs to so routes can act on the right
 * `tenant_id` value in writes (RLS + the stamp_tenant_id() trigger enforce
 * the rest).
 */
export async function requireTenantAdmin() {
  const supabase = createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new TenantAdminAuthError("Not authenticated");
  }

  const claims = decodeJwtPayload(session.access_token);
  const tenantId: string | undefined = claims?.tenant_id;

  if (!tenantId) {
    throw new TenantAdminAuthError("This account is not a tenant administrator");
  }

  return { session, supabase, tenantId, tenantRole: claims?.tenant_role as string | undefined };
}

export function tenantAdminErrorResponse(err: unknown) {
  if (err instanceof TenantAdminAuthError) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
  return NextResponse.json(
    { error: err instanceof Error ? err.message : "Unknown error" },
    { status: 500 }
  );
}
