import { NextResponse } from "next/server";
import { requireTenantAdmin, tenantAdminErrorResponse } from "@/lib/tenant-admin-guard";

const ALLOWED_FIELDS = [
  "city",
  "country",
  "latitude",
  "longitude",
  "calculation_method",
  "currency",
  "gold_price_per_gram",
  "silver_price_per_gram",
  "zakat_nisab_override",
];

/**
 * Reads/writes the CURRENT SESSION'S tenant_settings row only — same
 * RLS-bound anon-key pattern as every other tenant-admin route (see
 * branding route's comments for the full rationale, identical here).
 */
export async function GET() {
  let supabase;
  try {
    ({ supabase } = await requireTenantAdmin());
  } catch (err) {
    return tenantAdminErrorResponse(err);
  }

  const { data, error } = await supabase.from("tenant_settings").select("*").single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ settings: data });
}

export async function PUT(request: Request) {
  let supabase, tenantId;
  try {
    ({ supabase, tenantId } = await requireTenantAdmin());
  } catch (err) {
    return tenantAdminErrorResponse(err);
  }

  const body = await request.json();
  const fields: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in body) fields[key] = body[key];
  }

  const { data, error } = await supabase
    .from("tenant_settings")
    .update(fields)
    .eq("tenant_id", tenantId) // PostgREST update-safety guard; RLS is the real restriction
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, settings: data });
}
