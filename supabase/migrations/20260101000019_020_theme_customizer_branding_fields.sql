-- ═══════════════════════════════════════════════════════════
-- 020_theme_customizer_branding_fields.sql
-- Extends tenant_branding with the fields the Theme Customizer needs:
-- text color, font choices (UI/Arabic/Urdu), and a light/dark default.
-- Preset color themes are NOT a database table — they're a small,
-- fixed catalog (6-8 entries) shipped in the app's frontend code, since
-- "pick a preset" just means "apply these 4 color values in one click";
-- storing that in the DB would add a join for zero real benefit. If
-- presets ever need to be tenant-customizable themselves, that's the
-- point to promote them into a real table.
-- ═══════════════════════════════════════════════════════════

alter table tenant_branding add column text_color_hex text not null default '#0F172A';
alter table tenant_branding add column ui_font text not null default 'Inter';
alter table tenant_branding add column arabic_font text not null default 'Amiri';
alter table tenant_branding add column urdu_font text not null default 'Noto Nastaliq Urdu';
alter table tenant_branding add column dark_mode_default boolean not null default false;
alter table tenant_branding add column preset_theme_key text;

comment on column tenant_branding.preset_theme_key is
  'If the tenant last applied one of the fixed preset themes (see frontend PRESET_THEMES catalog), its key is recorded here purely so the settings UI can show it as "currently selected". Manually customizing any color clears this to NULL. Never used server-side for anything functional.';
