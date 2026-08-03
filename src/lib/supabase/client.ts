import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client.
 *
 * Uses ONLY the public anon key. This client authenticates as whichever
 * Postgres role GoTrue issues for the session (`anon` before login,
 * `authenticated` after login) — it can never act as `service_role`.
 * All tenant isolation is enforced by Postgres Row Level Security on
 * the other end, keyed off the `tenant_id` claim baked into the JWT
 * by our custom_access_token_hook at login time.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
