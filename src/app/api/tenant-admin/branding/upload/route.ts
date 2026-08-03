import { NextResponse } from "next/server";
import { requireTenantAdmin, tenantAdminErrorResponse } from "@/lib/tenant-admin-guard";
import { generateAndStorePwaIcons } from "@/lib/pwa-icons";

const ALLOWED_MIME = ["image/png", "image/jpeg", "image/svg+xml", "image/x-icon", "image/vnd.microsoft.icon"];
const MAX_BYTES = 2 * 1024 * 1024; // 2MB, matches the bucket's file_size_limit

/**
 * Uploads a logo or favicon to Supabase Storage, under a path prefixed by
 * the caller's OWN tenant_id (enforced twice: here, explicitly, and again
 * by storage.objects' RLS policies as defense-in-depth — a tenant admin
 * cannot write under another tenant's prefix even if this route had a bug).
 */
export async function POST(request: Request) {
  let supabase, tenantId;
  try {
    ({ supabase, tenantId } = await requireTenantAdmin());
  } catch (err) {
    return tenantAdminErrorResponse(err);
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const kind = formData.get("kind"); // "logo" | "favicon"

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (kind !== "logo" && kind !== "favicon") {
    return NextResponse.json({ error: "kind must be 'logo' or 'favicon'" }, { status: 400 });
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json(
      { error: `Unsupported file type "${file.type}". Allowed: PNG, JPEG, SVG, ICO.` },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File exceeds 2MB limit" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "png";
  const path = `${tenantId}/${kind}-${Date.now()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from("branding-assets")
    .upload(path, arrayBuffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 400 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("branding-assets").getPublicUrl(path);

  // If uploading a logo, also generate and store PWA icons (72..512)
  if (kind === "logo") {
    try {
      const { data: branding } = await supabase
        .from("tenant_branding")
        .select("app_name, primary_color_hex")
        .eq("tenant_id", tenantId)
        .single();

      await generateAndStorePwaIcons({
        supabase,
        tenantId,
        logoBuffer: Buffer.from(arrayBuffer),
        fallbackName: branding?.app_name || "ICI App",
        fallbackColor: branding?.primary_color_hex || "#0284C7",
      });
    } catch (iconErr) {
      console.error("[branding/upload] Non-fatal error generating PWA icons from logo:", iconErr);
    }
  }

  return NextResponse.json({ ok: true, url: publicUrl, path });
}
