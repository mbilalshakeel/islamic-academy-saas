import { createClient } from "@supabase/supabase-js";

/**
 * Elevated (service_role / RLS-bypass) Supabase client.
 *
 * SCOPE OF USE — read this before importing this file anywhere:
 *   - ONLY ever imported from server-only code under
 *     src/app/api/platform-admin/** route handlers.
 *   - EVERY route that imports this module MUST call
 *     requirePlatformAdmin() (see ./platform-admin-guard.ts) BEFORE
 *     using this client for anything.
 *   - NEVER imported into any client component, any tenant-admin route,
 *     or any public-PWA code path. There is no technical barrier
 *     stopping a future contributor from importing this elsewhere —
 *     the boundary here is procedural/code-review, which is why the
 *     guard check is enforced again independently at the DB layer too
 *     (RLS + am_i_platform_admin()) as defense-in-depth.
 *
 * Why this is necessary at all: tenant provisioning (creating a tenant
 * row, calling seed_tenant_defaults(), creating the first admin user,
 * suspending/deleting a tenant) are all operations that legitimately
 * need to act OUTSIDE any single tenant's RLS boundary — there is no
 * "current tenant" for a brand-new tenant that doesn't exist yet.
 */
export function createSupabaseServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. This must be a server-only env var " +
        "(no NEXT_PUBLIC_ prefix) — never expose it to the browser."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
