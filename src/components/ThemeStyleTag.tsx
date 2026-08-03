import { getOnColorText } from "@/lib/color-contrast";

/**
 * Server Component that renders the tenant's theme as CSS custom
 * properties in a <style> tag. Because this receives its color/font
 * values as props from a Server Component (the (public) layout, which
 * fetched them via getPublicTenantContext() during server rendering),
 * this style tag is part of the INITIAL server-rendered HTML — there is
 * no client-side fetch-then-repaint step, so no flash of default styling
 * before the tenant's theme applies. Next.js's App Router hoists <style>
 * tags rendered anywhere in the tree into <head> automatically.
 *
 * Design-system fixes applied here:
 *  1. `--tenant-on-primary` is now COMPUTED per-color (see
 *     getOnColorText) rather than hardcoded to white — this is the fix
 *     for the two dark presets (Midnight, Crimson Night) whose light
 *     primary colors previously produced unreadable white-on-light
 *     button text (2.1:1 / 2.8:1 contrast, both WCAG failures).
 *  2. Dark mode (`html.dark`) is applied ONLY when the tenant has
 *     explicitly set dark_mode_default = true. It is never inferred
 *     from the visitor's OS/browser color-scheme preference, and it is
 *     never applied inside either admin panel — those always render in
 *     light mode regardless of what a tenant's public app is set to.
 */
export function ThemeStyleTag({
  primaryColor,
  secondaryColor,
  backgroundColor,
  textColor,
  uiFont,
  arabicFont,
  urduFont,
  darkModeDefault = false,
}: {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  uiFont: string;
  arabicFont: string;
  urduFont: string;
  darkModeDefault?: boolean;
}) {
  const onPrimary = getOnColorText(primaryColor);

  const css = `
    :root {
      --tenant-primary: ${primaryColor};
      --tenant-secondary: ${secondaryColor};
      --tenant-on-primary: ${onPrimary};
      --tenant-background: ${backgroundColor};
      --tenant-text: ${textColor};
      --tenant-ui-font: '${uiFont}', sans-serif;
      --tenant-arabic-font: '${arabicFont}', serif;
      --tenant-urdu-font: '${urduFont}', serif;
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {/* Applies/removes the `dark` class on <html> strictly from the
          tenant's own explicit setting — no OS-preference fallback, so a
          tenant is never silently defaulted into dark mode. Runs before
          paint via a tiny inline script to avoid any flash. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.classList.${darkModeDefault ? "add" : "remove"}('dark');`,
        }}
      />
    </>
  );
}
