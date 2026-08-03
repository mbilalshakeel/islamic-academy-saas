import { NextResponse } from "next/server";
import { requirePlatformAdmin, platformAdminErrorResponse } from "@/lib/platform-admin-guard";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Read-only tenant data viewer, gated on a LIVE, unexpired, unrevoked
 * impersonation_grants row (checked on every single call, not cached).
 * See the design note in the POST .../impersonate route for why this is
 * a separate, explicitly read-only path rather than a session swap.
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await requirePlatformAdmin();
  } catch (err) {
    return platformAdminErrorResponse(err);
  }

  const { searchParams } = new URL(request.url);
  const grantId = searchParams.get("grant");
  if (!grantId) {
    return NextResponse.json({ error: "Missing grant id" }, { status: 400 });
  }

  const admin = createSupabaseServiceRoleClient();

  const { data: grant } = await admin
    .from("impersonation_grants")
    .select("id, tenant_id, expires_at, revoked_at")
    .eq("id", grantId)
    .eq("tenant_id", params.id)
    .single();

  if (!grant || grant.revoked_at || new Date(grant.expires_at) < new Date()) {
    return NextResponse.json({ error: "Impersonation grant is invalid or expired" }, { status: 403 });
  }

  const [{ data: tenant }, { data: hadiths }, { data: duas }, { data: users }] = await Promise.all([
    admin.from("tenants").select("id, slug, name, status, plan").eq("id", params.id).single(),
    admin.from("hadiths").select("hadith_number, text_en").eq("tenant_id", params.id).order("hadith_number").limit(5),
    admin.from("duas").select("title, subtitle").eq("tenant_id", params.id).order("sort_order").limit(5),
    admin.from("users").select("email, role").eq("tenant_id", params.id),
  ]);

  return NextResponse.json({
    read_only: true,
    tenant,
    sample_hadiths: hadiths,
    sample_duas: duas,
    admin_users: users,
    grant_expires_at: grant.expires_at,
  });
}
