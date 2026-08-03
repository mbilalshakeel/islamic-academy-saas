-- ═══════════════════════════════════════════════════════════
-- 011_site_pages_and_contact.sql
-- About/Home-hero free-form content (JSONB, per your approval)
-- + normalized Contact channels.
-- ═══════════════════════════════════════════════════════════

create table site_pages (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  page_key        text not null check (page_key in ('about','home_hero')),
  hero_title      text,
  hero_subtitle   text,
  content_blocks  jsonb not null default '[]',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (tenant_id, page_key)
);

create index idx_site_pages_tenant on site_pages (tenant_id);

select apply_tenant_rls('site_pages');


create table contact_channels (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  channel_type  text not null check (channel_type in ('phone','whatsapp','email','address','social','working_hours')),
  label         text not null,
  value         text not null,
  icon          text,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_contact_channels_tenant on contact_channels (tenant_id, sort_order);

select apply_tenant_rls('contact_channels');
