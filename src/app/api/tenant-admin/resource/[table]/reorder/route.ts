import { NextResponse } from "next/server";
import { requireTenantAdmin, tenantAdminErrorResponse } from "@/lib/tenant-admin-guard";
import { getTableConfig } from "@/lib/tenant-admin-tables-config";
import { bumpCacheVersion } from "@/lib/bump-cache-version";

/**
 * Bulk reorder: body is { order: [{ id, sort_order }, ...] } — the new
 * sort_order for each row after a drag-and-drop. Each update still goes
 * through the same anon-key/RLS-bound client, one row at a time (small
 * lists — 30 paras, 99 names, etc. — so N small updates is fine; would
 * move to a single UPSERT-based statement if these lists ever grew much
 * larger).
 */
export async function POST(request: Request, { params }: { params: { table: string } }) {
  let supabase, tenantId;
  try {
    ({ supabase, tenantId } = await requireTenantAdmin());
  } catch (err) {
    return tenantAdminErrorResponse(err);
  }

  const config = getTableConfig(params.table);
  if (!config || !config.sortColumn) {
    return NextResponse.json(
      { error: `Resource "${params.table}" does not support reordering` },
      { status: 400 }
    );
  }

  const { order } = (await request.json()) as { order: Array<{ id: string; sort_order: number }> };

  if (!Array.isArray(order) || order.length === 0) {
    return NextResponse.json({ error: "order must be a non-empty array" }, { status: 400 });
  }

  // Two-phase update: some reorderable tables (e.g. divine_names has
  // UNIQUE(tenant_id, category, order_index)) enforce a unique constraint
  // on the sort column. Naively updating rows one at a time, in the target
  // order, can transiently collide with another row that still holds the
  // value being moved into (e.g. swapping positions 1 and 2). Phase 1 moves
  // every affected row to a guaranteed-unique negative placeholder first;
  // phase 2 then sets everything to its real final value. Neither phase can
  // collide with the other, or with any row not being reordered (existing
  // sort values are assumed non-negative).
  for (const { id } of order) {
    const { error } = await supabase
      .from(config.table)
      .update({ [config.sortColumn]: -(Math.floor(Math.random() * 1_000_000) + 1) })
      .eq("id", id);
    if (error) {
      return NextResponse.json({ error: `Phase 1 failed: ${error.message}`, failed_id: id }, { status: 400 });
    }
  }

  const results = [];
  for (const { id, sort_order } of order) {
    const { data, error } = await supabase
      .from(config.table)
      .update({ [config.sortColumn]: sort_order })
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: `Phase 2 failed: ${error.message}`, failed_id: id }, { status: 400 });
    }
    if (data) results.push(data.id);
  }


  await bumpCacheVersion(supabase, tenantId);

  return NextResponse.json({ ok: true, reordered_count: results.length });
}
