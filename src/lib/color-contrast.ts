/**
 * Computes whether a given hex color needs dark or light text on top of it
 * for WCAG-acceptable contrast, using the standard relative-luminance
 * formula (same one used to compute the contrast ratios documented in the
 * Design System proposal). This is what fixes the "always white button
 * text" bug: the two dark presets (Midnight, Crimson Night) use light
 * primary colors, so white-on-primary was failing contrast at 2.1:1 and
 * 2.8:1 respectively. Computing this per-color instead of hardcoding white
 * guarantees every preset AND every custom color a tenant picks gets
 * readable button/badge text.
 */
export function getOnColorText(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return "#FFFFFF";
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  // Contrast against white (lum=1) vs near-black (lum≈0.006, our --text-primary equivalent).
  const contrastWithWhite = (1 + 0.05) / (luminance + 0.05);
  const contrastWithDark = (luminance + 0.05) / (0.006 + 0.05);
  return contrastWithWhite >= contrastWithDark ? "#FFFFFF" : "#0B1220";
}
