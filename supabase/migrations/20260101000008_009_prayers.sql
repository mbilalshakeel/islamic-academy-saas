-- ═══════════════════════════════════════════════════════════
-- 009_prayers.sql
-- Salah rakat info + Wudu / Namaz-Lesson / How-to-Perform guides.
--
-- NOTE on `prayers`: the real source data expresses rakat counts as
-- an ordered sequence (e.g. Dhuhr = "4 Sunnah, 4 Fard, 2 Sunnah,
-- 2 Nafl") which does not fit cleanly into a single fard/sunnah/nafl/
-- witr integer each (Dhuhr has TWO separate Sunnah groups, before and
-- after Fard). To preserve that fidelity exactly as authored, we keep
-- an ordered `rakat_breakdown` JSONB array (used for rendering) in
-- addition to plain summary integers (useful for search/filtering).
-- This is a small, intentional enhancement over the original schema
-- sketch's flat integer columns — flagged for your awareness.
-- ═══════════════════════════════════════════════════════════

create table prayers (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references tenants(id) on delete cascade,
  name              text not null,
  time_label        text,
  rakat_fard        int not null default 0,
  rakat_sunnah      int not null default 0,
  rakat_nafl        int not null default 0,
  rakat_witr        int not null default 0,
  rakat_breakdown   jsonb not null default '[]',  -- ordered [{type:"Sunnah",count:4}, {type:"Fard",count:4}, ...]
  sort_order        int not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_prayers_tenant on prayers (tenant_id, sort_order);

select apply_tenant_rls('prayers');


create table ritual_guides (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  guide_type    text not null check (guide_type in ('wudu','namaz_how_to','namaz_lesson')),
  title         text not null,
  intro_text    text,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_ritual_guides_tenant on ritual_guides (tenant_id, guide_type, sort_order);

select apply_tenant_rls('ritual_guides');


create table ritual_guide_steps (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  guide_id      uuid not null references ritual_guides(id) on delete cascade,
  step_number   int not null,
  title         text not null,
  description   text not null,
  arabic_text   text,
  icon          text,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_ritual_guide_steps_tenant on ritual_guide_steps (tenant_id, guide_id, sort_order);

select apply_tenant_rls('ritual_guide_steps');
