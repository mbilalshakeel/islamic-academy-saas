import { NextResponse } from "next/server";
import { requireTenantAdmin, tenantAdminErrorResponse } from "@/lib/tenant-admin-guard";
import { bumpCacheVersion } from "@/lib/bump-cache-version";

/**
 * Dedicated (not generic-resource-CRUD) route for editing a single
 * site_pages row by its page_key ("about" | "home_hero"). This does NOT
 * reuse the /api/tenant-admin/resource/[table] pattern from Stage 1,
 * because site_pages isn't a list of independent rows an admin adds/
 * removes — it's exactly one row per page_key per tenant (enforced by
 * UNIQUE(tenant_id, page_key)), and its real content lives inside a
 * JSONB `content_blocks` array that needs its own small block-level
 * editor (add/remove/reorder paragraph & list blocks), not a form with a
 * few plain columns. Everything else about tenant isolation is
 * identical: anon-key/RLS-bound client, explicit field whitelist, no
 * client-supplied tenant_id.
 */
export async function GET(_request: Request, { params }: { params: { pageKey: string } }) {
  let supabase;
  try {
    ({ supabase } = await requireTenantAdmin());
  } catch (err) {
    return tenantAdminErrorResponse(err);
  }

  if (!["about", "home_hero"].includes(params.pageKey)) {
    return NextResponse.json({ error: "Unknown page key" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("site_pages")
    .select("*")
    .eq("page_key", params.pageKey)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ page: data });
}

export async function PUT(request: Request, { params }: { params: { pageKey: string } }) {
  let supabase, tenantId;
  try {
    ({ supabase, tenantId } = await requireTenantAdmin());
  } catch (err) {
    return tenantAdminErrorResponse(err);
  }

  if (!["about", "home_hero"].includes(params.pageKey)) {
    return NextResponse.json({ error: "Unknown page key" }, { status: 404 });
  }

  const body = await request.json();
  const { hero_title, hero_subtitle, content_blocks } = body;

  if (content_blocks && !Array.isArray(content_blocks)) {
    return NextResponse.json({ error: "content_blocks must be an array" }, { status: 400 });
  }

  const fields: Record<string, unknown> = {};
  if (hero_title !== undefined) fields.hero_title = hero_title;
  if (hero_subtitle !== undefined) fields.hero_subtitle = hero_subtitle;
  if (content_blocks !== undefined) fields.content_blocks = content_blocks;

  const { data, error } = await supabase
    .from("site_pages")
    .update(fields)
    .eq("page_key", params.pageKey)
    .eq("tenant_id", tenantId) // PostgREST update-safety guard; RLS is the real restriction
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await bumpCacheVersion(supabase, tenantId);

  return NextResponse.json({ ok: true, page: data });
}
