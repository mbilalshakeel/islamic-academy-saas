import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Deliberate attack-simulation route. While authenticated as WHOEVER is
 * currently logged in (e.g. Tenant A's admin), this route attempts several
 * ways a malicious/buggy client might try to reach another tenant's data:
 *
 *   1. Forge a `tenant_id` filter in the query directly onto another
 *      tenant's known id, on a SELECT.
 *   2. Forge a `tenant_id` field in the INSERT payload, trying to create
 *      a new row that claims to belong to another tenant.
 *   3. Target another tenant's row by its exact primary key (id) on
 *      an UPDATE, without going anywhere near tenant_id.
 *   4. Ask for an unfiltered SELECT * and see how many rows come back
 *      across ALL tenants (should still only be the caller's own).
 *
 * All of this runs through the identical anon-key Supabase client used by
 * every legitimate route — there is no special/different client here.
 * Whatever protects the data, protects it against this route too.
 */
export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { target_tenant_id, target_hadith_id } = await request.json();

  const results: Record<string, unknown> = {
    attacking_as_user: session.user.email,
  };

  // ── Attack 1: forge tenant_id in a SELECT filter ──
  const attack1 = await supabase
    .from("hadiths")
    .select("id, tenant_id, hadith_number, text_en")
    .eq("tenant_id", target_tenant_id)
    .limit(10);
  results.attack1_select_with_forged_tenant_id_filter = {
    description: `SELECT * FROM hadiths WHERE tenant_id = '${target_tenant_id}' (victim tenant), while authenticated as attacker`,
    error: attack1.error?.message ?? null,
    rows_returned: attack1.data?.length ?? 0,
    data: attack1.data,
  };

  // ── Attack 2: forge tenant_id on INSERT, trying to plant a row "as" the
  // victim tenant. Uses the ATTACKER's own (real, valid) collection_id so the
  // only thing under test is whether the forged tenant_id sticks — a bogus
  // collection_id would fail on an unrelated FK error and prove nothing.
  const { data: ownCollection } = await supabase
    .from("hadith_collections")
    .select("id")
    .limit(1)
    .single();

  const attack2 = await supabase
    .from("hadiths")
    .insert({
      tenant_id: target_tenant_id, // forged: attacker claims this row belongs to the victim
      collection_id: ownCollection?.id,
      hadith_number: 9999,
      text_en: "INJECTED BY ATTACKER",
    })
    .select();
  results.attack2_insert_with_forged_tenant_id = {
    description: "INSERT INTO hadiths with tenant_id forged to victim's tenant (valid collection_id of attacker's own tenant used, so only the tenant_id forgery is under test)",
    error: attack2.error?.message ?? null,
    rows_inserted: attack2.data?.length ?? 0,
    data: attack2.data,
    note: attack2.data && attack2.data.length > 0
      ? `Row was inserted, but check actual_tenant_id below — did the forged tenant_id survive?`
      : undefined,
    actual_tenant_id_on_inserted_row: attack2.data?.[0]?.tenant_id ?? null,
  };

  // ── Attack 3: target victim's row by its exact primary key on UPDATE ──
  const attack3 = await supabase
    .from("hadiths")
    .update({ text_en: "HACKED VIA DIRECT ID TARGETING" })
    .eq("id", target_hadith_id)
    .select();
  results.attack3_update_victim_row_by_known_id = {
    description: `UPDATE hadiths SET text_en = ... WHERE id = '${target_hadith_id}' (victim's specific row)`,
    error: attack3.error?.message ?? null,
    rows_affected: attack3.data?.length ?? 0,
    data: attack3.data,
  };

  // ── Attack 4: unfiltered SELECT * across "all" tenants ──
  const attack4 = await supabase.from("hadiths").select("id, tenant_id, hadith_number");
  const distinctTenants = new Set((attack4.data ?? []).map((r: any) => r.tenant_id));
  results.attack4_unfiltered_select_star = {
    description: "SELECT * FROM hadiths with no filters at all",
    error: attack4.error?.message ?? null,
    total_rows_returned: attack4.data?.length ?? 0,
    distinct_tenant_ids_seen: Array.from(distinctTenants),
  };

  return NextResponse.json(results);
}

