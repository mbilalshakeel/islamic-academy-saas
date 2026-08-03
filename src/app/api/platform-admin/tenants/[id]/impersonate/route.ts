import { NextResponse } from "next/server";
import { requirePlatformAdmin, platformAdminErrorResponse } from "@/lib/platform-admin-guard";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * "View as tenant" — creates an audited, time-boxed impersonation grant.
 *
 * SECURITY DESIGN, READ BEFORE MODIFYING:
 * This deliberately does NOT swap the platform admin's session for a real
 * tenant-admin session (i.e. we never mint a JWT carrying the tenant's
 * tenant_id claim on behalf of the platform admin). That "true swap"
 * approach is what most impersonation features do, but it has two
 * problems: (1) once swapped, the resulting session is indistinguishable
 * from the platform admin actually logging in as that tenant's real
 * account — full read/write, at any RLS-protected endpoint, hard to keep
 * strictly read-only, and (2) it muddies audit logs because the identity
 * on every subsequent request becomes the tenant, not "platform admin X
 * viewing tenant Y".
 *
 * Instead: this route only ever RECORDS a grant (who, which tenant, why,
 * expiry). The actual viewing happens through a separate, explicitly
 * read-only route (GET .../impersonate/view) that checks for a live,
 * unexpired, unrevoked grant every single call and uses the service_role
 * client to fetch that tenant's data for display — the platform admin
 * never gets a tenant-scoped write-capable session at all.
 *
 * Trade-off (flagged for the user): this means "view as tenant" cannot
 * exercise the tenant admin panel's own UI/forms pixel-for-pixel (since
 * it's a different, dedicated read-only viewer), and it cannot be used to
 * reproduce a write-related bug a tenant reports. If/when that's needed,
 * a proper "true impersonation" mode should be built as its own reviewed
 * feature with explicit write-audit-logging, not bolted onto this.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  let session;
  try {
    ({ session } = await requirePlatformAdmin());
  } catch (err) {
    return platformAdminErrorResponse(err);
  }

  const { reason } = await request.json();
  if (!reason || reason.trim().length < 5) {
    return NextResponse.json(
      { error: "A reason (5+ characters) is required for every impersonation grant." },
      { status: 400 }
    );
  }

  const admin = createSupabaseServiceRoleClient();

  const { data: tenant } = await admin.from("tenants").select("id, slug, name").eq("id", params.id).single();
  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  const { data: grant, error } = await admin
    .from("impersonation_grants")
    .insert({
      tenant_id: tenant.id,
      platform_admin_id: session.user.id,
      reason,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    grant_id: grant.id,
    tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name },
    expires_at: grant.expires_at,
    view_url: `/platform-admin/tenants/${tenant.id}/view?grant=${grant.id}`,
  });
}
