-- ═══════════════════════════════════════════════════════════
-- 003_branding_and_pwa.sql
-- Tenant branding + PWA manifest/icon data. Drives generation of
-- each tenant's manifest.json, sw.js cache versioning, and theme.
-- ═══════════════════════════════════════════════════════════

create table tenant_branding (
  id                    uuid primary key default gen_random_uuid(),
  tenant_id             uuid not null unique references tenants(id) on delete cascade,
  app_name              text not null,
  short_name            text not null,
  tagline               text,
  description           text,
  theme_color           text not null default '#0284C7',
  background_color      text not null default '#FFFFFF',
  primary_color_hex     text not null default '#0284C7',
  secondary_color_hex   text not null default '#0EA5E9',
  favicon_url           text,
  logo_url              text,
  sw_cache_version      text not null default '1',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

select apply_tenant_rls('tenant_branding');

create table tenant_pwa_icons (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  size        int not null check (size in (72,96,128,144,152,192,384,512)),
  url         text not null,
  purpose     text not null default 'any' check (purpose in ('any','maskable')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (tenant_id, size, purpose)
);

create index idx_pwa_icons_tenant on tenant_pwa_icons (tenant_id);

select apply_tenant_rls('tenant_pwa_icons');
