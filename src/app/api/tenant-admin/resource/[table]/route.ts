import { NextResponse } from "next/server";
import { requireTenantAdmin, tenantAdminErrorResponse } from "@/lib/tenant-admin-guard";
import { getTableConfig, pickWritableFields } from "@/lib/tenant-admin-tables-config";
import { bumpCacheVersion } from "@/lib/bump-cache-version";

/**
 * Generic tenant-scoped CRUD endpoint for every Stage-1 content table.
 * Table access is restricted to the whitelist in tenant-admin-tables-config.ts
 * — there is no way to point this route at an arbitrary table name.
 *
 * SECURITY NOTE: this route (like every other tenant-admin route in this
 * project) uses the anon-key, RLS-bound Supabase client. It never uses
 * service_role. That means even a bug in this generic handler cannot leak
 * or corrupt another tenant's data — Postgres RLS + the stamp_tenant_id()
 * trigger are the actual enforcement, exactly as already proven for the
 * hand-written hadiths/duas/branding routes earlier in this project. This
 * route is a UX/code-reuse convenience layered on top of that, not a
 * replacement for it.
 */

export async function GET(request: Request, { params }: { params: { table: string } }) {
  let supabase;
  try {
    ({ supabase } = await requireTenantAdmin());
  } catch (err) {
    return tenantAdminErrorResponse(err);
  }

  const config = getTableConfig(params.table);
  if (!config) {
    return NextResponse.json({ error: `Unknown resource "${params.table}"` }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  let query = supabase.from(config.table).select("*").order(config.defaultOrderBy, { ascending: true });

  if (config.parentColumn) {
    const parentValue = searchParams.get(config.parentColumn);
    if (parentValue) {
      query = query.eq(config.parentColumn, parentValue);
    }
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ items: data });
}

export async function POST(request: Request, { params }: { params: { table: string } }) {
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

  for (const requiredField of config.requiredOnCreate) {
    const value = fields[requiredField];
    if (value === undefined || value === null || value === "") {
      return NextResponse.json(
        { error: `"${requiredField}" is required and cannot be empty` },
        { status: 400 }
      );
    }
  }

  // tenant_id is never taken from the client — RLS's stamp_tenant_id()
  // trigger overwrites it server-side regardless, but we don't even pass
  // one through: `fields` only ever contains config.writableColumns, which
  // never includes tenant_id for any table.
  const { data, error } = await supabase.from(config.table).insert(fields).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await bumpCacheVersion(supabase, tenantId);

  return NextResponse.json({ ok: true, item: data });
}
