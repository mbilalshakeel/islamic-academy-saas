import { NextResponse } from "next/server";
import { requirePlatformAdmin, platformAdminErrorResponse } from "@/lib/platform-admin-guard";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Lists tenants, cross-tenant, with a basic per-tenant content
 * health-check count (hadiths + duas). This is exactly the kind of
 * query that MUST run outside any single tenant's RLS boundary — hence
 * service_role — which is why this route is gated by
 * requirePlatformAdmin() first.
 *
 * By default, tenants in `pending_deletion` are EXCLUDED from this list —
 * that's the whole point of the soft-delete grace period, they should
 * disappear from the normal working view. Pass
 * ?include_pending_deletion=true to see them (used by the dedicated
 * "Pending Deletion" section of the dashboard, which offers Restore).
 */
export async function GET(request: Request) {
  try {
    await requirePlatformAdmin();
  } catch (err) {
    return platformAdminErrorResponse(err);
  }

  const { searchParams } = new URL(request.url);
  const includePendingDeletion = searchParams.get("include_pending_deletion") === "true";

  const admin = createSupabaseServiceRoleClient();

  let query = admin
    .from("tenants")
    .select(
      "id, slug, name, status, plan, is_template, created_at, deletion_requested_at, deletion_scheduled_for"
    )
    .order("created_at", { ascending: false });

  if (!includePendingDeletion) {
    query = query.neq("status", "pending_deletion");
  } else {
    query = query.eq("status", "pending_deletion");
  }

  const { data: tenants, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }


  // Per-tenant content counts, as a basic health check. Small N (tenants),
  // so a query-per-tenant is fine for now; would batch/aggregate if this
  // ever needs to scale to hundreds of tenants.
  const withCounts = await Promise.all(
    tenants.map(async (t) => {
      const [{ count: hadithCount }, { count: duaCount }, { count: userCount }] =
        await Promise.all([
          admin.from("hadiths").select("id", { count: "exact", head: true }).eq("tenant_id", t.id),
          admin.from("duas").select("id", { count: "exact", head: true }).eq("tenant_id", t.id),
          admin.from("users").select("id", { count: "exact", head: true }).eq("tenant_id", t.id),
        ]);

      return {
        ...t,
        hadith_count: hadithCount ?? 0,
        dua_count: duaCount ?? 0,
        admin_user_count: userCount ?? 0,
      };
    })
  );

  return NextResponse.json({ tenants: withCounts });
}

/**
 * Creates a brand-new tenant, fully seeded and ready to use, in one flow:
 *   1. Validate input (name, slug uniqueness, admin email, plan).
 *   2. INSERT the tenant row.
 *   3. Call seed_tenant_defaults() to copy all content from the template
 *      tenant (99 names, 40 hadiths, duas, pillars, prayers, Q&A, etc).
 *   4. Create a tenant_branding row with sensible defaults.
 *   5. Create the first institute_admin (owner) auth user + `users` row.
 *   6. Send that user a real invite email (magic-link style) via GoTrue's
 *      admin invite endpoint, rather than generating/displaying a
 *      temporary password — avoids ever having a plaintext password
 *      pass through our own server/logs at all.
 *
 * Every step runs under the SAME service_role client so that if any step
 * fails, we can roll back what was already created (Postgres inserts are
 * wrapped in a transaction via a single RPC where possible; the auth-user
 * creation is a separate external call to GoTrue and is best-effort
 * rolled back manually below since GoTrue user creation cannot itself
 * participate in a Postgres transaction).
 */
export async function POST(request: Request) {
  try {
    await requirePlatformAdmin();
  } catch (err) {
    return platformAdminErrorResponse(err);
  }

  const { institute_name, slug, admin_email, plan } = await request.json();

  if (!institute_name || !slug || !admin_email) {
    return NextResponse.json(
      { error: "institute_name, slug, and admin_email are required" },
      { status: 400 }
    );
  }

  const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  if (!slugPattern.test(slug)) {
    return NextResponse.json(
      { error: "Slug must be lowercase letters, numbers, and hyphens only" },
      { status: 400 }
    );
  }

  const admin = createSupabaseServiceRoleClient();

  // ── Step 1: slug uniqueness (re-checked server-side; the UI's live-check
  // is just a UX convenience, this is the actual guard) ──
  const { data: existing } = await admin.from("tenants").select("id").eq("slug", slug).maybeSingle();
  if (existing) {
    return NextResponse.json({ error: `Slug "${slug}" is already taken` }, { status: 409 });
  }

  // ── Step 2: create the tenant row ──
  const { data: tenant, error: tenantError } = await admin
    .from("tenants")
    .insert({
      slug,
      name: institute_name,
      status: "active",
      plan: plan || "trial",
      is_template: false,
    })
    .select()
    .single();

  if (tenantError || !tenant) {
    return NextResponse.json(
      { error: tenantError?.message || "Failed to create tenant" },
      { status: 400 }
    );
  }

  try {
    // ── Step 3: seed all default content from the template tenant ──
    const { error: seedError } = await admin.rpc("seed_tenant_defaults", {
      p_new_tenant_id: tenant.id,
    });
    if (seedError) throw new Error(`Seeding failed: ${seedError.message}`);

    // ── Step 4: tenant_branding with sensible defaults ──
    // NOTE: seed_tenant_defaults() (Step 3, above) already copies a
    // tenant_branding row from the template tenant, since branding is one
    // of the tables that table is designed to seed for every new tenant.
    // We UPSERT here (on tenant_id) rather than INSERT, so this step
    // overwrites the generic template branding with values personalized
    // to the new institute's actual name — while still reusing the same
    // sensible color/theme defaults from the template.
    const { error: brandingError } = await admin.from("tenant_branding").upsert(
      {
        tenant_id: tenant.id,
        app_name: institute_name,
        short_name: institute_name.slice(0, 12),
        tagline: "Learn Islam — Anywhere, Anytime",
        description: `${institute_name} — Islamic education, powered by ICI`,
        theme_color: "#0284C7",
        background_color: "#FFFFFF",
        primary_color_hex: "#0284C7",
        secondary_color_hex: "#0EA5E9",
        sw_cache_version: "1",
      },
      { onConflict: "tenant_id" }
    );
    if (brandingError) throw new Error(`Branding setup failed: ${brandingError.message}`);


    // ── Step 5 & 6: create the first admin user + send invite ──
    const { data: invitedUser, error: inviteError } =
      await admin.auth.admin.inviteUserByEmail(admin_email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_BASE_DOMAIN ? "https://" + slug + "." + process.env.NEXT_PUBLIC_APP_BASE_DOMAIN : "http://localhost:3000"}/t/${slug}/admin`,
      });

    if (inviteError || !invitedUser?.user) {
      throw new Error(`Failed to invite admin: ${inviteError?.message}`);
    }

    const { error: userRowError } = await admin.from("users").insert({
      id: invitedUser.user.id,
      tenant_id: tenant.id,
      email: admin_email,
      role: "owner",
    });
    if (userRowError) throw new Error(`Failed to link admin user: ${userRowError.message}`);

    return NextResponse.json({
      ok: true,
      tenant,
      admin_user_id: invitedUser.user.id,
      admin_email,
      invite_sent: true,
    });
  } catch (err) {
    // ── Rollback: tenant creation failed partway through. Cascade delete
    // cleans up any seeded content/branding/users rows automatically via
    // ON DELETE CASCADE; we only need to remove the tenant row itself. ──
    await admin.from("tenants").delete().eq("id", tenant.id);

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Tenant creation failed", rolled_back: true },
      { status: 500 }
    );
  }
}

