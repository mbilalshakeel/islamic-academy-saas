import { NextResponse } from "next/server";
import { getPublicTenantContext } from "@/lib/public-tenant";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { tenant, supabase, branding } = await getPublicTenantContext(params.slug);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Fetch tenant's PWA icons sorted by size
    const { data: iconRows } = await supabase
      .from("tenant_pwa_icons")
      .select("size, url, purpose")
      .eq("tenant_id", tenant.id)
      .order("size", { ascending: true });

    const icons = (iconRows || []).map((row) => ({
      src: row.url,
      sizes: `${row.size}x${row.size}`,
      type: "image/png",
      // Set 192 and 512 as "any maskable" to satisfy Lighthouse PWA audit installability checks
      purpose: row.size === 192 || row.size === 512 ? "any maskable" : row.purpose || "any",
    }));

    const manifest = {
      name: branding?.app_name || tenant.name,
      short_name: branding?.short_name || tenant.name.substring(0, 12),
      description:
        branding?.description ||
        branding?.tagline ||
        `Islamic educational platform for ${tenant.name}`,
      start_url: `/t/${tenant.slug}/`,
      scope: `/t/${tenant.slug}/`,
      display: "standalone",
      background_color: branding?.background_color || "#FFFFFF",
      theme_color: branding?.primary_color_hex || branding?.theme_color || "#0284C7",
      orientation: "any",
      icons,
    };

    return NextResponse.json(manifest, {
      headers: {
        "Content-Type": "application/manifest+json; charset=utf-8",
        "Cache-Control": "public, max-age=60, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    console.error("[manifest.json] Error generating manifest:", err);
    return NextResponse.json({ error: "Failed to generate manifest" }, { status: 500 });
  }
}
