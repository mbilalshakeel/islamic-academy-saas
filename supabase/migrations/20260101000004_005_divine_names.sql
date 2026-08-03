-- ═══════════════════════════════════════════════════════════
-- 005_divine_names.sql
-- Unified table for Asma-ul-Husna (Allah's 99 Names) and the
-- Prophet's Beautiful Names — same shape, split by `category`.
-- ═══════════════════════════════════════════════════════════

create table divine_names (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references tenants(id) on delete cascade,
  category          text not null check (category in ('allah','prophet')),
  order_index       int not null,
  arabic            text not null,
  transliteration   text not null,
  meaning_en        text not null,
  meaning_urdu      text,
  meaning_extra     text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (tenant_id, category, order_index)
);

create index idx_divine_names_tenant on divine_names (tenant_id, category, order_index);

select apply_tenant_rls('divine_names');
