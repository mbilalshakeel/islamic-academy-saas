import { createClient } from "@supabase/supabase-js";

/**
 * Plain, shared-anon-key Supabase client — the SAME key used by every
 * browser in a normal Supabase app (public, meant to be exposed). Used
 * ONLY for calls that don't need any tenant_id claim at all, such as
 * get_tenant_by_slug() (a narrow public-directory RPC, see migration 017)
 * — the first step of resolving an incoming public slug into a tenant id,
 * before we know which tenant to scope anything else to.
 */
export function createPlainAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
