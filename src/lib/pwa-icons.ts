import sharp from "sharp";
import type { SupabaseClient } from "@supabase/supabase-js";

export const PWA_ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512] as const;
export type PwaIconSize = (typeof PWA_ICON_SIZES)[number];

interface GeneratePwaIconsParams {
  supabase: SupabaseClient;
  tenantId: string;
  logoBuffer?: Buffer | ArrayBuffer | null;
  fallbackName?: string;
  fallbackColor?: string;
}

/**
 * Generates all 8 required PWA icon sizes (72, 96, 128, 144, 152, 192, 384, 512)
 * from an uploaded logo Buffer (or generates a fallback SVG icon with initials/color
 * if no logo Buffer is provided).
 *
 * Uploads each icon to the public "branding-assets" bucket under `${tenantId}/pwa/icon-${size}.png`
 * and upserts rows into `tenant_pwa_icons` for that tenant.
 */
export async function generateAndStorePwaIcons({
  supabase,
  tenantId,
  logoBuffer,
  fallbackName = "ICI App",
  fallbackColor = "#0284C7",
}: GeneratePwaIconsParams): Promise<{ size: number; url: string }[]> {
  const results: { size: number; url: string }[] = [];

  // Generate initials for fallback icon if needed
  const words = fallbackName
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  let initials = "ICI";
  if (words.length >= 2) {
    initials = `${words[0][0]}${words[1][0]}`.toUpperCase();
  } else if (words.length === 1 && words[0].length >= 1) {
    initials = words[0].substring(0, 2).toUpperCase();
  }

  for (const size of PWA_ICON_SIZES) {
    let pngBuffer: Buffer;

    if (logoBuffer && logoBuffer.byteLength > 0) {
      try {
        // Resize uploaded logo to fit cleanly inside a square of exact size x size with transparent padding
        pngBuffer = await sharp(Buffer.from(logoBuffer))
          .resize(size, size, {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .png()
          .toBuffer();
      } catch (err) {
        console.error(`[pwa-icons] Failed to process logo buffer for size ${size}, using fallback`, err);
        pngBuffer = await generateFallbackIconBuffer(size, initials, fallbackColor);
      }
    } else {
      pngBuffer = await generateFallbackIconBuffer(size, initials, fallbackColor);
    }

    const path = `${tenantId}/pwa/icon-${size}.png`;

    const { error: uploadErr } = await supabase.storage
      .from("branding-assets")
      .upload(path, pngBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadErr) {
      console.error(`[pwa-icons] Upload failed for ${path}:`, uploadErr.message);
      continue;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("branding-assets").getPublicUrl(path);

    // Append version param to ensure browsers cache-bust updated icon images
    const versionedUrl = `${publicUrl}?v=${Date.now()}`;

    // Upsert into tenant_pwa_icons
    const { error: dbErr } = await supabase
      .from("tenant_pwa_icons")
      .upsert(
        {
          tenant_id: tenantId,
          size,
          url: versionedUrl,
          purpose: "any",
        },
        {
          onConflict: "tenant_id,size,purpose",
        }
      );

    if (dbErr) {
      console.error(`[pwa-icons] DB upsert failed for size ${size}:`, dbErr.message);
      continue;
    }

    results.push({ size, url: versionedUrl });
  }

  return results;
}

async function generateFallbackIconBuffer(size: number, initials: string, backgroundColor: string): Promise<Buffer> {
  const fontSize = Math.round(size * 0.45);
  const rx = Math.round(size * 0.22);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" rx="${rx}" fill="${backgroundColor}" />
      <text x="50%" y="54%" font-family="sans-serif" font-weight="700" font-size="${fontSize}" fill="#FFFFFF" dominant-baseline="middle" text-anchor="middle">${initials}</text>
    </svg>
  `.trim();

  return sharp(Buffer.from(svg)).png().toBuffer();
}
