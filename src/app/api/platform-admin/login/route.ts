import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * SEPARATE login endpoint for platform_admins only.
 *
 * This intentionally does NOT reuse /api/auth/login (the tenant-admin
 * login route). Both ultimately call the same Supabase Auth password
 * grant under the hood — there's only one identity provider — but this
 * route adds a platform-admin-specific check on top: after a successful
 * password auth, it verifies the resulting session actually carries
 * `is_platform_admin: true` and, critically, has NO tenant_id claim at
 * all. If either check fails, the session is immediately signed back
 * out and the login is rejected — a tenant admin's correct password
 * for their own tenant-admin account must never grant access here.
 */
export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    return NextResponse.json({ error: error?.message || "Login failed" }, { status: 401 });
  }

  const payload = JSON.parse(
    Buffer.from(
      data.session.access_token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    ).toString("utf-8")
  );

  const isPlatformAdmin = payload.is_platform_admin === true;
  const hasTenantId = Boolean(payload.tenant_id);

  if (!isPlatformAdmin || hasTenantId) {
    // Defense-in-depth: never leave a rejected session's cookies sitting
    // around client-side.
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: "This account is not a platform administrator." },
      { status: 403 }
    );
  }

  return NextResponse.json({
    ok: true,
    user_id: data.user?.id,
    email: data.user?.email,
    is_platform_admin: true,
  });
}
