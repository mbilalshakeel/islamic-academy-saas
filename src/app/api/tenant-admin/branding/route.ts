import { NextResponse } from "next/server";
import { requireTenantAdmin, tenantAdminErrorResponse } from "@/lib/tenant-admin-guard";

/**
 * Reads/writes the CURRENT SESSION'S tenant_branding row only. Uses the
 * normal anon-key, RLS-bound Supabase client (see requireTenantAdmin) —
 * NOT service_role. If RLS were ever misconfigured, this route could leak
 * or corrupt another tenant's branding; since RLS is correct (proven
 * earlier in this project), a PUT here can only ever affect the caller's
 * own tenant_branding row, regardless of what tenant_id (if any) the
 * client tried to sneak into the request body — the stamp_tenant_id()
 * trigger + RLS policies are the actual enforcement, this route doesn't
 * need to (and does not) trust anything the client sends about identity.
 */
export async function GET() {
  try {
    var { supabase } = await requireTenantAdmin();
  } catch (err) {
    return tenantAdminErrorResponse(err);
  }

  const { data, error } = await supabase.from("tenant_branding").select("*").single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ branding: data });
}

export async function PUT(request: Request) {
  let supabase, tenantId;
  try {
    ({ supabase, tenantId } = await requireTenantAdmin());
  } catch (err) {
    return tenantAdminErrorResponse(err);
  }


  const body = await request.json();

  // Whitelist of fields the Theme Customizer is allowed to write. Anything
  // else in the request body (including a client-supplied tenant_id, id,
  // created_at, etc.) is silently ignored — never passed through to the
  // update call at all.
  const allowedFields = [
    "app_name",
    "short_name",
    "tagline",
    "description",
    "theme_color",
    "background_color",
    "primary_color_hex",
    "secondary_color_hex",
    "text_color_hex",
    "ui_font",
    "arabic_font",
    "urdu_font",
    "dark_mode_default",
    "preset_theme_key",
    "favicon_url",
    "logo_url",
  ];

  const updatePayload: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) updatePayload[key] = body[key];
  }

  // Bumping sw_cache_version is how the service worker knows to invalidate
  // its cache and pick up the new branding/theme on next load — done as a
  // read-then-increment rather than trusting a client-supplied value.
  const { data: current } = await supabase.from("tenant_branding").select("sw_cache_version").single();
  const currentVersion = parseInt(current?.sw_cache_version ?? "1", 10) || 1;
  updatePayload.sw_cache_version = String(currentVersion + 1);

  const { data, error } = await supabase
    .from("tenant_branding")
    .update(updatePayload)
    // PostgREST requires an explicit filter for UPDATE (a safety guard against
    // accidental unrestricted updates) — this is NOT the tenant-isolation
    // mechanism itself, RLS still independently restricts this to the
    // caller's own row regardless of what tenant_id is passed here. We use
    // the guard's own resolved tenantId (from the session's JWT claim, never
    // client input) rather than trusting anything in the request body.
    .eq("tenant_id", tenantId)
    .select()
    .single();


  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, branding: data });
}
