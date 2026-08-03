import { NextResponse } from "next/server";
import { requirePlatformAdmin, platformAdminErrorResponse } from "@/lib/platform-admin-guard";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

export async function GET(request: Request) {
  try {
    await requirePlatformAdmin();
  } catch (err) {
    return platformAdminErrorResponse(err);
  }

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "slug query param required" }, { status: 400 });
  }

  const admin = createSupabaseServiceRoleClient();
  const { data } = await admin.from("tenants").select("id").eq("slug", slug).maybeSingle();

  return NextResponse.json({ slug, available: !data });
}
