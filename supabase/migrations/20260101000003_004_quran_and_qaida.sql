-- ═══════════════════════════════════════════════════════════
-- 004_quran_and_qaida.sql
-- Quran editions/paras (16-line, 15-line) and Qaida courses.
-- ═══════════════════════════════════════════════════════════

create table quran_editions (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  name        text not null,
  line_count  int not null,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_quran_editions_tenant on quran_editions (tenant_id, sort_order);

select apply_tenant_rls('quran_editions');


create table quran_paras (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  edition_id      uuid not null references quran_editions(id) on delete cascade,
  para_number     int not null check (para_number between 1 and 30),
  name_arabic     text not null,
  file_provider   text not null default 'google_drive'
                    check (file_provider in ('google_drive','url','upload','none')),
  file_reference  text,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (edition_id, para_number)
);

create index idx_quran_paras_tenant on quran_paras (tenant_id, edition_id, sort_order);

select apply_tenant_rls('quran_paras');


create table qaida_courses (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  name            text not null,
  level_label     text,
  color_theme     text,
  file_provider   text not null default 'none'
                    check (file_provider in ('google_drive','url','upload','none')),
  file_reference  text,
  sort_order      int not null default 0,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_qaida_courses_tenant on qaida_courses (tenant_id, sort_order);

select apply_tenant_rls('qaida_courses');
