import { NextResponse } from "next/server";
import { requireTenantAdmin, tenantAdminErrorResponse } from "@/lib/tenant-admin-guard";
import { getTableConfig, pickWritableFields } from "@/lib/tenant-admin-tables-config";
import { bumpCacheVersion } from "@/lib/bump-cache-version";

export async function PATCH(
  request: Request,
  { params }: { params: { table: string; id: string } }
) {
  let supabase, tenantId;
  try {
    ({ supabase, tenantId } = await requireTenantAdmin());
  } catch (err) {
    return tenantAdminErrorResponse(err);
  }

  const config = getTableConfig(params.table);
  if (!config) {
    return NextResponse.json({ error: `Unknown resource "${params.table}"` }, { status: 404 });
  }

  const body = await request.json();
  const fields = pickWritableFields(config, body);

  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  // Guard against explicitly clearing a required field to empty on edit —
  // same validation as create, applied to whatever subset of required
  // fields is actually present in this PATCH body.
  for (const requiredField of config.requiredOnCreate) {
    if (requiredField in fields) {
      const value = fields[requiredField];
      if (value === null || value === "") {
        return NextResponse.json(
          { error: `"${requiredField}" cannot be left empty` },
          { status: 400 }
        );
      }
    }
  }

  const { data, error } = await supabase
    .from(config.table)
    .update(fields)
    // .eq("id", ...) is required by PostgREST's update-safety guard (it
    // refuses an UPDATE with no WHERE clause at all) — RLS is still what
    // actually restricts this to the caller's own tenant's row; this filter
    // alone would do nothing across tenants without RLS behind it.
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!data) {
    // RLS silently filtered the row out (either it belongs to another
    // tenant, or doesn't exist) — report as 404, not 403, to avoid leaking
    // which is the case.
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await bumpCacheVersion(supabase, tenantId);

  return NextResponse.json({ ok: true, item: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { table: string; id: string } }
) {
  let supabase, tenantId;
  try {
    ({ supabase, tenantId } = await requireTenantAdmin());
  } catch (err) {
    return tenantAdminErrorResponse(err);
  }

  const config = getTableConfig(params.table);
  if (!config) {
    return NextResponse.json({ error: `Unknown resource "${params.table}"` }, { status: 404 });
  }

  const { data, error } = await supabase
    .from(config.table)
    .delete()
    .eq("id", params.id)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await bumpCacheVersion(supabase, tenantId);

  return NextResponse.json({ ok: true, deleted_id: params.id });
}
