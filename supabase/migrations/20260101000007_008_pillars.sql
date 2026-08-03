-- ═══════════════════════════════════════════════════════════
-- 008_pillars.sql
-- 5 Pillars of Islam. The real source data (pillarData in the
-- original app) has THREE distinct content shapes per pillar:
--   - a flat "details" bullet list
--   - an "importance" paragraph (folded directly onto `pillars`)
--   - a "guide" list of {title, desc} steps (richer than a plain
--     bullet — needs its own table: pillar_guide_steps)
-- ═══════════════════════════════════════════════════════════

create table pillars (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  slug          text not null,
  title         text not null,
  arabic_text   text,
  description   text not null,
  importance    text,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (tenant_id, slug)
);

create index idx_pillars_tenant on pillars (tenant_id, sort_order);

select apply_tenant_rls('pillars');


create table pillar_details (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  pillar_id     uuid not null references pillars(id) on delete cascade,
  detail_text   text not null,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_pillar_details_tenant on pillar_details (tenant_id, pillar_id, sort_order);

select apply_tenant_rls('pillar_details');


create table pillar_guide_steps (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  pillar_id     uuid not null references pillars(id) on delete cascade,
  title         text not null,
  description   text not null,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_pillar_guide_steps_tenant on pillar_guide_steps (tenant_id, pillar_id, sort_order);

select apply_tenant_rls('pillar_guide_steps');
