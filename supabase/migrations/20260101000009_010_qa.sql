-- ═══════════════════════════════════════════════════════════
-- 010_qa.sql
-- Islamic Q&A, filterable by category (matches the 5 existing
-- filter tabs: namaz, quran, roza, zakat, aqaid).
-- ═══════════════════════════════════════════════════════════

create table qa_items (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  category    text not null check (category in ('namaz','quran','roza','zakat','aqaid')),
  question    text not null,
  answer      text not null,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_qa_items_tenant on qa_items (tenant_id, category, sort_order);

select apply_tenant_rls('qa_items');
