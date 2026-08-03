-- ═══════════════════════════════════════════════════════════
-- 012_home_menu_items.sql
-- Per your explicit requirement: tenants MUST be able to toggle,
-- reorder, and relabel dashboard cards with zero code changes.
-- module_key maps to a fixed, code-known feature/screen; the admin
-- panel can only turn modules on/off, rename, and reorder them —
-- it cannot invent new module types (that still requires a release).
-- ═══════════════════════════════════════════════════════════

create table home_menu_items (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references tenants(id) on delete cascade,
  module_key     text not null check (module_key in (
                    'quran_16line','quran_15line','qaida','daily_duas',
                    'allah_names','prophet_names','hadith','pillars',
                    'islamic_knowledge','prayers','books'
                  )),
  section        text not null check (section in ('reading','learning')),
  custom_label   text,
  is_enabled     boolean not null default true,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (tenant_id, module_key)
);

create index idx_home_menu_items_tenant on home_menu_items (tenant_id, section, sort_order);

select apply_tenant_rls('home_menu_items');
