import { getPublicTenantContext, buildGoogleFontsHref } from "@/lib/public-tenant";
import { ThemeStyleTag } from "@/components/ThemeStyleTag";
import { TenantNav } from "@/components/TenantNav";
import { PwaRegistrar } from "@/components/PwaRegistrar";

export default async function PublicTenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const { tenant, supabase, branding } = await getPublicTenantContext(params.slug);

  const { data: navItems } = await supabase
    .from("home_menu_items")
    .select("module_key, custom_label, is_enabled, sort_order")
    .eq("section", "nav")
    .order("sort_order", { ascending: true });

  const fontsHref = buildGoogleFontsHref([
    branding?.ui_font ?? "Inter",
    branding?.arabic_font ?? "Amiri",
    branding?.urdu_font ?? "Noto Nastaliq Urdu",
  ]);

  return (
    <div className="tenant-page-bg pb-20 md:pb-0">
      <link rel="stylesheet" href={fontsHref} />
      <link rel="manifest" href={`/t/${tenant.slug}/manifest.json`} />
      <meta name="theme-color" content={branding?.primary_color_hex ?? branding?.theme_color ?? "#0284C7"} />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content={branding?.short_name ?? tenant.name} />
      <PwaRegistrar slug={tenant.slug} />
      <ThemeStyleTag
        primaryColor={branding?.primary_color_hex ?? "#0284C7"}
        secondaryColor={branding?.secondary_color_hex ?? "#0EA5E9"}
        backgroundColor={branding?.background_color ?? "#FFFFFF"}
        textColor={branding?.text_color_hex ?? "#0F172A"}
        uiFont={branding?.ui_font ?? "Inter"}
        arabicFont={branding?.arabic_font ?? "Amiri"}
        urduFont={branding?.urdu_font ?? "Noto Nastaliq Urdu"}
        darkModeDefault={branding?.dark_mode_default ?? false}
      />

      {/* Header: solid tenant-primary bar, logo + app name/tagline. Kept
          deliberately plain (no motif here) — the motif is reserved for
          the hero banner directly below, per the Design System's "one
          signature touch, used sparingly" rule. */}
      <header className="tenant-primary-bg" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            {branding?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={branding.logo_url}
                alt={branding.app_name}
                className="w-10 h-10 rounded-xl bg-white/15 object-contain"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-white/15" />
            )}
            <div>
              <div className="tenant-on-primary font-bold leading-tight" style={{ fontSize: "var(--fs-h3)" }}>
                {branding?.app_name ?? tenant.name}
              </div>
              {branding?.tagline && (
                <div className="tenant-on-primary text-xs leading-tight" style={{ opacity: 0.85 }}>
                  {branding.tagline}
                </div>
              )}
            </div>
          </div>
        </div>
        <TenantNav slug={tenant.slug} navItems={navItems ?? []} />
      </header>

      <main>{children}</main>
    </div>
  );
}
