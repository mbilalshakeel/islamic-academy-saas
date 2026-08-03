"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Field, Input, Select } from "@/components/ui";
import { getOnColorText } from "@/lib/color-contrast";

// ── Redesigned preset theme catalog (approved Design System proposal) ──
// Each preset now pairs primary + a genuinely DIFFERENT hue family as
// accent (not "darker/lighter of the same color", the old catalog's
// flaw), and every pairing has been verified against WCAG contrast —
// see DESIGN_SYSTEM_NOTES.md for the exact ratios. Deliberately shipped
// as frontend code, not a DB table — see migration 020's comment for the
// reasoning. `key` is recorded on tenant_branding.preset_theme_key purely
// so the UI can show which preset (if any) is currently active.
const PRESET_THEMES = [
  { key: "noor_blue", label: "Noor Blue", primary: "#0369A1", secondary: "#D97706", background: "#F7FAFC", text: "#0B1826" },
  { key: "zaytun_green", label: "Zaytun Green", primary: "#047857", secondary: "#8A6206", background: "#F6FBF8", text: "#0B1F16" },
  { key: "amethyst", label: "Amethyst", primary: "#6D28D9", secondary: "#0F9C8F", background: "#FAF9FF", text: "#201B33" },
  { key: "saffron_dawn", label: "Saffron Dawn", primary: "#B45309", secondary: "#0F766E", background: "#FFFBF3", text: "#3B1D02" },
  { key: "rose_dusk", label: "Rose Dusk", primary: "#BE123C", secondary: "#0284C7", background: "#FFF8F8", text: "#4C0519" },
  { key: "midnight_dome", label: "Midnight Dome", primary: "#38BDF8", secondary: "#FBBF24", background: "#0F172A", text: "#E7ECF3" },
  { key: "teal_oasis", label: "Teal Oasis", primary: "#0F766E", secondary: "#EA580C", background: "#F3FBFA", text: "#042F2E" },
  { key: "crimson_night", label: "Crimson Night", primary: "#F87171", secondary: "#FBBF24", background: "#18181B", text: "#F4F4F5" },
] as const;

const UI_FONTS = ["Inter", "Roboto", "Poppins", "Lato", "Nunito", "Work Sans"];
const ARABIC_FONTS = ["Amiri", "Scheherazade New", "Lateef", "Noto Naskh Arabic", "Aref Ruqaa"];
const URDU_FONTS = ["Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", "Gulzar", "Noto Naskh Arabic"];

type Branding = {
  app_name: string;
  short_name: string;
  tagline: string | null;
  description: string | null;
  primary_color_hex: string;
  secondary_color_hex: string;
  background_color: string;
  text_color_hex: string;
  ui_font: string;
  arabic_font: string;
  urdu_font: string;
  dark_mode_default: boolean;
  preset_theme_key: string | null;
  favicon_url: string | null;
  logo_url: string | null;
  sw_cache_version: string;
};

export default function ThemeCustomizerPage() {
  const [branding, setBranding] = useState<Branding | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [generatingIcons, setGeneratingIcons] = useState(false);
  const [iconsGeneratedMsg, setIconsGeneratedMsg] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/tenant-admin/branding")
      .then((r) => r.json())
      .then((body) => {
        setBranding(body.branding);
        setLoading(false);
      });
  }, []);

  function update<K extends keyof Branding>(key: K, value: Branding[K]) {
    setBranding((prev) => (prev ? { ...prev, [key]: value, ...(key !== "preset_theme_key" ? { preset_theme_key: null } : {}) } : prev));
  }

  function applyPreset(preset: (typeof PRESET_THEMES)[number]) {
    setBranding((prev) =>
      prev
        ? {
            ...prev,
            primary_color_hex: preset.primary,
            secondary_color_hex: preset.secondary,
            background_color: preset.background,
            text_color_hex: preset.text,
            preset_theme_key: preset.key,
          }
        : prev
    );
  }

  async function handleUpload(file: File, kind: "logo" | "favicon") {
    const setUploading = kind === "logo" ? setUploadingLogo : setUploadingFavicon;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", kind);

    const res = await fetch("/api/tenant-admin/branding/upload", { method: "POST", body: formData });
    const body = await res.json();
    setUploading(false);

    if (!res.ok) {
      setError(body.error);
      return;
    }

    update(kind === "logo" ? "logo_url" : "favicon_url", body.url);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file, "logo");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    if (!branding) return;
    setSaving(true);
    setError(null);

    const res = await fetch("/api/tenant-admin/branding", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(branding),
    });
    const body = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(body.error);
      return;
    }

    setBranding(body.branding);
    setSavedAt(new Date());
  }

  async function handleGenerateIcons() {
    setGeneratingIcons(true);
    setError(null);
    setIconsGeneratedMsg(null);

    try {
      const res = await fetch("/api/tenant-admin/branding/generate-icons", { method: "POST" });
      const body = await res.json();

      if (!res.ok) {
        setError(body.error || "Failed to generate PWA icons");
        return;
      }

      const generated = body.icons?.length ?? 0;
      setIconsGeneratedMsg(`Generated ${generated} PWA icon(s).`);
    } catch (err) {
      setError("Failed to generate PWA icons: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setGeneratingIcons(false);
    }
  }

  if (loading || !branding) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ color: "var(--text-tertiary)" }}>
        Loading...
      </div>
    );
  }

  const onPrimary = getOnColorText(branding.primary_color_hex);
  const onSecondary = getOnColorText(branding.secondary_color_hex);

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-0)", padding: "var(--sp-6)" }}>
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ═══ LEFT: Controls ═══ */}
        <div className="space-y-6">
          <div>
            <h1 className="ds-h1">Theme Customizer</h1>
            <p className="ds-caption">Personalize your institute&apos;s app appearance</p>
          </div>

          {/* App name & tagline */}
          <section className="ds-card space-y-3">
            <h2 className="ds-h3">App Identity</h2>
            <Field label="App Name">
              <Input value={branding.app_name} onChange={(e) => update("app_name", e.target.value)} />
            </Field>
            <Field label="Tagline">
              <Input value={branding.tagline ?? ""} onChange={(e) => update("tagline", e.target.value)} />
            </Field>
          </section>

          {/* Preset themes */}
          <section className="ds-card space-y-3">
            <h2 className="ds-h3">Preset Themes</h2>
            <p className="ds-caption" style={{ marginTop: -8 }}>
              Each preset pairs a primary and accent color from genuinely different hue families, tested for WCAG-readable contrast — a great look with zero further tweaking.
            </p>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_THEMES.map((preset) => {
                const isActive = branding.preset_theme_key === preset.key;
                return (
                  <button
                    key={preset.key}
                    onClick={() => applyPreset(preset)}
                    className="rounded-lg flex flex-col items-center gap-1.5 transition-colors"
                    style={{
                      padding: 8,
                      border: `2px solid ${isActive ? "var(--text-primary)" : "transparent"}`,
                      background: isActive ? "var(--surface-2)" : "transparent",
                    }}
                    title={preset.label}
                  >
                    <div className="flex w-full rounded overflow-hidden" style={{ height: 32 }}>
                      <div style={{ flex: 1, background: preset.primary }} />
                      <div style={{ flex: 1, background: preset.secondary }} />
                    </div>
                    <span style={{ fontSize: 10, color: "var(--text-secondary)" }}>{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Manual colors */}
          <section className="ds-card space-y-3">
            <h2 className="ds-h3">Custom Colors</h2>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["primary_color_hex", "Primary"],
                  ["secondary_color_hex", "Secondary"],
                  ["background_color", "Background"],
                  ["text_color_hex", "Text"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={branding[key]}
                    onChange={(e) => update(key, e.target.value)}
                    className="cursor-pointer"
                    style={{ width: 40, height: 40, borderRadius: "var(--r-sm)", border: "1px solid var(--border-subtle)" }}
                  />
                  <div>
                    <div style={{ fontSize: "var(--fs-caption)", fontWeight: 600, color: "var(--text-secondary)" }}>{label}</div>
                    <div className="mono" style={{ fontSize: 10, color: "var(--text-tertiary)", fontFamily: "ui-monospace, monospace" }}>
                      {branding[key]}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Fonts */}
          <section className="ds-card space-y-3">
            <h2 className="ds-h3">Fonts</h2>
            <Field label="UI Font">
              <Select value={branding.ui_font} onChange={(e) => update("ui_font", e.target.value)}>
                {UI_FONTS.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </Select>
            </Field>
            <Field label="Arabic Font">
              <Select value={branding.arabic_font} onChange={(e) => update("arabic_font", e.target.value)}>
                {ARABIC_FONTS.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </Select>
            </Field>
            <Field label="Urdu Font">
              <Select value={branding.urdu_font} onChange={(e) => update("urdu_font", e.target.value)}>
                {URDU_FONTS.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </Select>
            </Field>
          </section>

          {/* Logo / Favicon */}
          <section className="ds-card space-y-3">
            <h2 className="ds-h3">Logo &amp; Favicon</h2>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className="text-center cursor-pointer"
              style={{
                border: `2px dashed ${dragOver ? "var(--tenant-primary, #0369A1)" : "var(--border-strong)"}`,
                borderRadius: "var(--r-md)",
                padding: "var(--sp-6)",
                background: dragOver ? "var(--surface-2)" : "transparent",
              }}
            >
              {uploadingLogo ? (
                <p style={{ fontSize: "var(--fs-body)", color: "var(--text-tertiary)" }}>Uploading...</p>
              ) : branding.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={branding.logo_url} alt="Logo" style={{ height: 64, margin: "0 auto", objectFit: "contain" }} />
              ) : (
                <p style={{ fontSize: "var(--fs-body)", color: "var(--text-tertiary)" }}>Drag &amp; drop a logo, or click to browse (PNG/JPEG/SVG, max 2MB)</p>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "logo")}
              />
            </div>

            <div>
              <label className="ds-label">Favicon</label>
              <div className="flex items-center gap-3">
                {branding.favicon_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={branding.favicon_url}
                    alt="Favicon"
                    style={{ width: 32, height: 32, objectFit: "contain", border: "1px solid var(--border-subtle)", borderRadius: "var(--r-sm)" }}
                  />
                )}
                <input
                  type="file"
                  accept="image/x-icon,image/png"
                  disabled={uploadingFavicon}
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "favicon")}
                  style={{ fontSize: "var(--fs-caption)" }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
              <div>
                <div style={{ fontSize: "var(--fs-caption)", fontWeight: 600 }}>PWA App Icons</div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                  Generates all required Home Screen sizes (72..512) from logo or initials
                </div>
              </div>
              <Button type="button" variant="secondary" onClick={handleGenerateIcons} disabled={generatingIcons}>
                {generatingIcons ? "Generating..." : "Generate PWA Icons"}
              </Button>
            </div>
            {iconsGeneratedMsg && (
              <p style={{ fontSize: "var(--fs-caption)", color: "var(--success)" }}>{iconsGeneratedMsg}</p>
            )}
          </section>

          {/* Dark mode default */}
          <section className="ds-card flex items-center justify-between">
            <div>
              <h2 className="ds-h3">Default Mode</h2>
              <p className="ds-caption">
                What visitors see by default. Light mode is the platform default for every new tenant — only explicitly enable Dark here if you want it.
              </p>
            </div>
            <button
              onClick={() => update("dark_mode_default", !branding.dark_mode_default)}
              className="font-semibold flex-shrink-0"
              style={{
                padding: "8px 18px",
                borderRadius: "var(--r-full)",
                fontSize: "var(--fs-caption)",
                minHeight: 40,
                marginLeft: "var(--sp-4)",
                background: branding.dark_mode_default ? "#10151C" : "var(--surface-2)",
                color: branding.dark_mode_default ? "#fff" : "var(--text-secondary)",
              }}
            >
              {branding.dark_mode_default ? "🌙 Dark" : "☀️ Light"}
            </button>
          </section>

          {error && <p style={{ color: "var(--danger)", fontSize: "var(--fs-body)" }}>{error}</p>}

          <Button onClick={handleSave} disabled={saving} style={{ width: "100%" }}>
            {saving ? "Saving..." : "Save Theme"}
          </Button>
          {savedAt && (
            <p className="text-center" style={{ fontSize: "var(--fs-caption)", color: "var(--success)" }}>
              Saved at {savedAt.toLocaleTimeString()} — cache version bumped to {branding.sw_cache_version}
            </p>
          )}
        </div>

        {/* ═══ RIGHT: Live Preview ═══ */}
        <div className="lg:sticky lg:top-6 self-start">
          <h2 className="ds-h3" style={{ marginBottom: "var(--sp-3)" }}>
            Live Preview
          </h2>
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: branding.background_color,
              color: branding.text_color_hex,
              fontFamily: branding.ui_font,
              boxShadow: "var(--shadow-lg)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 relative overflow-hidden" style={{ padding: "var(--sp-4) var(--sp-5)", background: branding.primary_color_hex }}>
              <div className="ds-motif-bg" style={{ opacity: 0.08 }} />
              {branding.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={branding.logo_url} alt="logo" style={{ width: 32, height: 32, objectFit: "contain", background: "rgba(255,255,255,0.2)", borderRadius: 6 }} className="relative" />
              ) : (
                <div style={{ width: 32, height: 32, borderRadius: 6, background: "rgba(255,255,255,0.2)" }} className="relative" />
              )}
              <div className="relative">
                <div className="font-bold" style={{ color: onPrimary }}>
                  {branding.app_name || "Your App Name"}
                </div>
                <div style={{ fontSize: 12, color: onPrimary, opacity: 0.85 }}>{branding.tagline || "Your tagline here"}</div>
              </div>
            </div>

            {/* Body */}
            <div className="space-y-4" style={{ padding: "var(--sp-5)" }}>
              <div
                className="rounded-lg"
                style={{ padding: "var(--sp-4)", boxShadow: "var(--shadow-xs)", border: `1px solid ${branding.secondary_color_hex}30` }}
              >
                <p style={{ fontSize: 13, opacity: 0.65, marginBottom: 8 }}>Sample card</p>
                <p style={{ fontFamily: branding.arabic_font, fontSize: "1.6rem", lineHeight: 1.8, marginBottom: 6 }} dir="rtl">
                  بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
                </p>
                <p style={{ fontFamily: branding.urdu_font, fontSize: "1.15rem", lineHeight: 1.9 }} dir="rtl">
                  اسلامی تعلیمات کا خلاصہ
                </p>
              </div>

              <div className="flex gap-3">
                <button className="rounded-lg font-semibold" style={{ padding: "10px 18px", fontSize: 14, background: branding.primary_color_hex, color: onPrimary }}>
                  Primary Button
                </button>
                <button className="rounded-lg font-semibold" style={{ padding: "10px 18px", fontSize: 14, background: branding.secondary_color_hex, color: onSecondary }}>
                  Secondary Button
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {["Quran", "Hadith"].map((label) => (
                  <div
                    key={label}
                    className="rounded-lg flex flex-col items-center gap-1.5"
                    style={{ padding: "var(--sp-3)", boxShadow: "var(--shadow-xs)", border: `1px solid ${branding.secondary_color_hex}30` }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: "999px", background: branding.secondary_color_hex }} />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
