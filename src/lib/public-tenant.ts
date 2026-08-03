import { createPlainAnonClient } from "@/lib/supabase/plain-anon";
import { createSupabaseScopedAnonClient } from "@/lib/supabase/scoped-anon";
import { notFound } from "next/navigation";

export type PublicTenant = {
  id: string;
  slug: string;
  name: string;
  status: string;
};

export type TenantBranding = {
  app_name: string;
  short_name: string;
  tagline: string | null;
  description: string | null;
  theme_color: string;
  background_color: string;
  primary_color_hex: string;
  secondary_color_hex: string;
  text_color_hex: string;
  ui_font: string;
  arabic_font: string;
  urdu_font: string;
  dark_mode_default: boolean;
  favicon_url: string | null;
  logo_url: string | null;
  sw_cache_version: string;
};

/**
 * Server-side resolution of a public tenant + its branding, for use in
 * Server Components (layouts/pages under /t/[slug]/(public)/**). This
 * is what makes theme application happen DURING server rendering rather
 * than after a client-side fetch — the branding is already known by the
 * time the HTML is generated, so there is no flash of default styling
 * followed by a theme swap.
 *
 * Uses the same two-step resolution as every other public route in this
 * project: a plain-anon-key call to the narrow get_tenant_by_slug() RPC
 * (no tenant claim needed for that lookup), then a short-lived
 * tenant-scoped anon JWT for the actual tenant-scoped reads. Never uses
 * service_role — this is exactly the same privilege level as any
 * anonymous visitor's browser already has.
 */
export async function getPublicTenantContext(slug: string) {
  const plain = createPlainAnonClient();
  const { data: tenantRows } = await plain.rpc("get_tenant_by_slug", { p_slug: slug });
  const tenant = tenantRows?.[0] as PublicTenant | undefined;

  if (!tenant) {
    notFound();
  }

  const supabase = createSupabaseScopedAnonClient(tenant!.id);

  const { data: branding } = await supabase
    .from("tenant_branding")
    .select(
      "app_name, short_name, tagline, description, theme_color, background_color, primary_color_hex, secondary_color_hex, text_color_hex, ui_font, arabic_font, urdu_font, dark_mode_default, favicon_url, logo_url, sw_cache_version"
    )
    .single();

  return { tenant: tenant!, supabase, branding: branding as TenantBranding | null };
}

/**
 * Builds a Google Fonts CSS2 API href for the tenant's configured
 * UI/Arabic/Urdu fonts in one request, deduplicated. Rendered as a real
 * <link> tag directly in the Server Component tree (Next.js App Router
 * hoists <link> elements into <head> automatically), so the font
 * stylesheet is part of the initial server-rendered HTML — no
 * client-side font-swap flash either.
 */
export function buildGoogleFontsHref(fonts: string[]): string {
  const unique = Array.from(new Set(fonts.filter(Boolean)));
  const families = unique
    .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@400;500;600;700`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}
