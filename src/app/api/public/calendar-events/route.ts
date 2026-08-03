import { NextResponse } from "next/server";
import { createPlainAnonClient } from "@/lib/supabase/plain-anon";
import { createSupabaseScopedAnonClient } from "@/lib/supabase/scoped-anon";

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
  const { data: items, error } = await supabase
    .from("calendar_events")
    .select("id, hijri_month, hijri_day, title, description, is_recurring_yearly")
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ items });
}
