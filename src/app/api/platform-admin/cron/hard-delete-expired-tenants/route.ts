import { NextResponse } from "next/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Scheduled job entry point — intended to be invoked periodically (e.g. a
 * daily cron calling this route with a shared secret, or a platform-level
 * scheduled task). NOT gated by requirePlatformAdmin() (there is no logged
 * -in human platform admin in a cron context) — instead gated by a
 * shared-secret header, checked against a server-only env var.
 *
 * Orchestration order matters here:
 *   1. Find every tenant whose 14-day grace period has expired (read-only
 *      query, service_role).
 *   2. For each one, delete its GoTrue auth.users accounts FIRST — this is
 *      an external system (not part of the same Postgres transaction as
 *      the tenant row), so it must happen before the tenant is gone,
 *      otherwise we lose the ability to look up which auth users belonged
 *      to it (the `users` row that mapped auth user -> tenant will have
 *      just been cascade-deleted).
 *   3. THEN call hard_delete_expired_tenants(), which performs the actual
 *      irreversible `DELETE FROM tenants` (cascading to every content
 *      table via each table's tenant_id FK).
 */
export async function POST(request: Request) {
  const cronSecret = request.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseServiceRoleClient();

  const { data: expiredTenants, error: findError } = await admin
    .from("tenants")
    .select("id, slug")
    .eq("status", "pending_deletion")
    .lt("deletion_scheduled_for", new Date().toISOString());

  if (findError) {
    return NextResponse.json({ error: findError.message }, { status: 500 });
  }

  const results: Array<{ tenant_id: string; slug: string; auth_users_removed: number }> = [];

  for (const tenant of expiredTenants ?? []) {
    const { data: tenantUsers } = await admin.from("users").select("id").eq("tenant_id", tenant.id);

    let removed = 0;
    for (const u of tenantUsers ?? []) {
      const { error: delErr } = await admin.auth.admin.deleteUser(u.id);
      if (!delErr) removed++;
    }

    results.push({ tenant_id: tenant.id, slug: tenant.slug, auth_users_removed: removed });
  }

  const { data: deleted, error: deleteError } = await admin.rpc("hard_delete_expired_tenants");

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message, auth_cleanup: results }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    checked_at: new Date().toISOString(),
    tenants_hard_deleted: deleted,
    auth_cleanup: results,
  });
}
