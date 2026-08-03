-- ═══════════════════════════════════════════════════════════
-- 006_duas.sql
-- Covers: Daily Masnoon Duas, 6 Kalimas, Ayat-ul-Kursi,
-- Dua-e-Qunoot, Iman-e-Mujmal, Iman-e-Mufassal — one flexible
-- category -> items structure serves all of them.
-- ═══════════════════════════════════════════════════════════

create table dua_categories (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  slug          text not null,
  title         text not null,
  subtitle      text,
  icon          text,
  display_type  text not null default 'list_screen'
                  check (display_type in ('list_screen','modal')),
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (tenant_id, slug)
);

create index idx_dua_categories_tenant on dua_categories (tenant_id, sort_order);

select apply_tenant_rls('dua_categories');


create table duas (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references tenants(id) on delete cascade,
  category_id         uuid not null references dua_categories(id) on delete cascade,
  title               text not null,
  subtitle            text,
  arabic_text         text not null,
  translation_en      text not null,
  icon                text,
  numbered_position   int,
  sort_order          int not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_duas_tenant on duas (tenant_id, category_id, sort_order);

select apply_tenant_rls('duas');
