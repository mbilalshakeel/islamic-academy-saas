import { NextResponse } from "next/server";
import { createPlainAnonClient } from "@/lib/supabase/plain-anon";
import { createSupabaseScopedAnonClient } from "@/lib/supabase/scoped-anon";

/**
 * Public, read-only, slug-based settings lookup — used by the anonymous
 * Zakat Calculator and Sehri/Iftar pages to get a tenant's currency and
 * gold/silver prices (Zakat) without requiring login. Only ever exposes
 * the specific fields those public tools need, never the full row.
 *
 * Resolves slug -> tenant_id via get_tenant_by_slug() (a narrow, anon-
 * grantable RPC — see migration 017), NOT service_role: this route has
 * no legitimate need to bypass RLS at all, only to know which tenant a
 * public slug belongs to before minting a scoped-anon token for it.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  const plainClient = createPlainAnonClient();
  const { data: tenantRows } = await plainClient.rpc("get_tenant_by_slug", { p_slug: slug });
  const tenant = tenantRows?.[0];

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const supabase = createSupabaseScopedAnonClient(tenant.id);
  const { data: settings } = await supabase
    .from("tenant_settings")
    .select("currency, gold_price_per_gram, silver_price_per_gram, zakat_nisab_override")
    .maybeSingle();

  return NextResponse.json({ tenant_id: tenant.id, settings });
}
