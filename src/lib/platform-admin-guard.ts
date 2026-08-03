import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export class PlatformAdminAuthError extends Error {}

/**
 * Guard used at the top of every /api/platform-admin/* route handler.
 *
 * Verifies the caller in TWO independent ways before allowing any
 * platform-admin operation to proceed:
 *
 *   1. Must have a valid session at all (anon-key client, cookie-based).
 *   2. Must be a platform_admin — checked LIVE against the database via
 *      am_i_platform_admin(), NOT by trusting the `is_platform_admin`
 *      JWT claim alone. The claim is only refreshed when the JWT itself
 *      is refreshed (up to ~1hr in this app's config), so if a platform
 *      admin were deactivated mid-session, the claim alone could stay
 *      stale for that whole window. The live DB check closes that gap.
 *
 * Deliberately does NOT accept a tenant_id anywhere in this path —
 * platform-admin routes are tenant-agnostic by construction.
 */
export async function requirePlatformAdmin() {
  const supabase = createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new PlatformAdminAuthError("Not authenticated");
  }

  const { data: isAdmin, error } = await supabase.rpc("am_i_platform_admin");

  if (error || !isAdmin) {
    throw new PlatformAdminAuthError("Not a platform admin");
  }

  return { session, supabaseAsCaller: supabase };
}

export function platformAdminErrorResponse(err: unknown) {
  if (err instanceof PlatformAdminAuthError) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
  return NextResponse.json(
    { error: err instanceof Error ? err.message : "Unknown error" },
    { status: 500 }
  );
}
