import { NextResponse } from "next/server";
import { requireTenantAdmin, tenantAdminErrorResponse } from "@/lib/tenant-admin-guard";
import { generateAndStorePwaIcons } from "@/lib/pwa-icons";

/**
 * Explicit endpoint to generate PWA icons (72, 96, 128, 144, 152, 192, 384, 512)
 * for the authenticated tenant admin.
 * Uses the existing branding.logo_url if available, otherwise generates a clean
 * initials SVG fallback icon matching the tenant's app_name and primary_color_hex.
 */
export async function POST() {
  let supabase, tenantId;
  try {
    ({ supabase, tenantId } = await requireTenantAdmin());
  } catch (err) {
    return tenantAdminErrorResponse(err);
  }

  const { data: branding, error: fetchErr } = await supabase
    .from("tenant_branding")
    .select("app_name, primary_color_hex, logo_url")
    .eq("tenant_id", tenantId)
    .single();

  if (fetchErr || !branding) {
    return NextResponse.json({ error: "Could not load tenant branding" }, { status: 404 });
  }

  let logoBuffer: Buffer | undefined;

  if (branding.logo_url) {
    try {
      const res = await fetch(branding.logo_url);
      if (res.ok) {
        const ab = await res.arrayBuffer();
        logoBuffer = Buffer.from(ab);
      }
    } catch (err) {
      console.warn("[generate-icons] Failed to fetch existing logo_url, using fallback SVG", err);
    }
  }

  try {
    const icons = await generateAndStorePwaIcons({
      supabase,
      tenantId,
      logoBuffer,
      fallbackName: branding.app_name,
      fallbackColor: branding.primary_color_hex,
    });

    return NextResponse.json({ ok: true, icons });
  } catch (err: any) {
    console.error("[generate-icons] Error generating PWA icons:", err);
    return NextResponse.json({ error: err?.message || "Failed to generate icons" }, { status: 500 });
  }
}
