import { NextResponse } from "next/server";
import { requirePlatformAdmin, platformAdminErrorResponse } from "@/lib/platform-admin-guard";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Instant, lossless undo of a pending soft-delete. Since soft-delete never
 * touched any actual data (only tenants.status + the deletion_* bookkeeping
 * columns), restoring is just clearing those fields and putting `status`
 * back to whatever it was before deletion was requested (e.g. a previously
 * `suspended` tenant is restored to `suspended`, not silently reactivated).
 */
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    await requirePlatformAdmin();
  } catch (err) {
    return platformAdminErrorResponse(err);
  }

  const admin = createSupabaseServiceRoleClient();

  const { data, error } = await admin.rpc("restore_tenant", { p_tenant_id: params.id }).single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, tenant: data });
}
