import { NextResponse } from "next/server";
import { requirePlatformAdmin, platformAdminErrorResponse } from "@/lib/platform-admin-guard";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    await requirePlatformAdmin();
  } catch (err) {
    return platformAdminErrorResponse(err);
  }

  const admin = createSupabaseServiceRoleClient();

  const { data: tenant } = await admin.from("tenants").select("is_template").eq("id", params.id).single();
  if (tenant?.is_template) {
    return NextResponse.json({ error: "Cannot suspend the template tenant" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("tenants")
    .update({ status: "suspended" })
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, tenant: data });
}
