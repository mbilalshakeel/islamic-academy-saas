import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Bumps the CURRENT SESSION'S tenant_branding.sw_cache_version, so the
 * PWA's service worker knows to invalidate its cache and re-fetch content
 * on next load. Called after every successful content write across all
 * Stage 1 CRUD routes.
 *
 * Uses the same anon-key, RLS-bound client as the write that triggered it
 * — this can only ever touch the caller's own tenant_branding row (there
 * is exactly one such row per tenant, enforced by the UNIQUE(tenant_id)
 * constraint), never another tenant's, regardless of what table the
 * content change came from.
 */
export async function bumpCacheVersion(supabase: SupabaseClient, tenantId: string) {
  const { data: current } = await supabase
    .from("tenant_branding")
    .select("sw_cache_version")
    .eq("tenant_id", tenantId)
    .single();

  const currentVersion = parseInt(current?.sw_cache_version ?? "1", 10) || 1;

  await supabase
    .from("tenant_branding")
    .update({ sw_cache_version: String(currentVersion + 1) })
    .eq("tenant_id", tenantId);
}
