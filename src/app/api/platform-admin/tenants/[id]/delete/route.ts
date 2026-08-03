import { NextResponse } from "next/server";
import { requirePlatformAdmin, platformAdminErrorResponse } from "@/lib/platform-admin-guard";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * SOFT-DELETE. This no longer performs any actual data deletion — it marks
 * the tenant `pending_deletion` with a 14-day expiry via soft_delete_tenant().
 * All of the tenant's content, branding, and admin accounts remain fully
 * intact and untouched. See /api/platform-admin/tenants/[id]/restore for the
 * undo path, and /api/platform-admin/cron/hard-delete-expired-tenants for
 * what actually happens once the grace period passes.
 *
 * Still requires re-typing the tenant's exact slug as a confirmation step —
 * this is a meaningful action (removes the tenant from every normal admin
 * view and starts a countdown to real deletion) even though it's reversible.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  let session;
  try {
    ({ session } = await requirePlatformAdmin());
  } catch (err) {
    return platformAdminErrorResponse(err);
  }

  const { confirm_slug } = await request.json();
  const admin = createSupabaseServiceRoleClient();

  const { data: tenant, error: fetchError } = await admin
    .from("tenants")
    .select("id, slug, is_template, status")
    .eq("id", params.id)
    .single();

  if (fetchError || !tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  if (tenant.is_template) {
    return NextResponse.json({ error: "Cannot delete the template tenant" }, { status: 400 });
  }

  if (tenant.status === "pending_deletion") {
    return NextResponse.json({ error: "Tenant is already pending deletion" }, { status: 400 });
  }

  if (confirm_slug !== tenant.slug) {
    return NextResponse.json(
      { error: `Confirmation slug does not match. Expected "${tenant.slug}".` },
      { status: 400 }
    );
  }

  const { data, error } = await admin
    .rpc("soft_delete_tenant", {
      p_tenant_id: tenant.id,
      p_requested_by: session.user.id,
    })
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, tenant: data });
}
