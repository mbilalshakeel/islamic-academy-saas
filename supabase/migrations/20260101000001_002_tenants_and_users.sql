-- ═══════════════════════════════════════════════════════════
-- 002_tenants_and_users.sql
-- Platform-level tenancy tables. These define WHO the tenants
-- are, so they are handled differently from content tables:
--   - tenants: RLS keyed on its own `id`, not a tenant_id column.
--   - platform_admins: cross-tenant, no RLS policies granted to
--     the app roles at all (only service_role/bypass-RLS can
--     touch it — see Section 3.4 of the design doc).
--   - users: normal tenant-scoped table (tenant admin accounts).
-- ═══════════════════════════════════════════════════════════

-- ─────────────────────────────────────────
-- tenants
-- ─────────────────────────────────────────
create table tenants (
  id                  uuid primary key default gen_random_uuid(),
  slug                text unique not null,
  custom_domain       text unique,
  name                text not null,
  status              text not null default 'trial'
                        check (status in ('trial','active','suspended','cancelled')),
  plan                text,
  is_template         boolean not null default false,
  timezone            text not null default 'UTC',
  default_language    text not null default 'en',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Only one template tenant should ever exist.
create unique index uq_tenants_single_template
  on tenants (is_template)
  where is_template = true;

create trigger trg_touch_updated_at
  before update on tenants
  for each row execute function touch_updated_at();

alter table tenants enable row level security;
alter table tenants force row level security;

-- A tenant can only ever see/edit its own row (matched on id, not tenant_id).
create policy tenant_self_read on tenants
  for select using (id = current_tenant_id());

create policy tenant_self_update on tenants
  for update using (id = current_tenant_id())
  with check (id = current_tenant_id());

-- No insert/delete policy granted to the `authenticated` role:
-- tenant creation/deletion is a privileged operation performed only
-- by backend provisioning code running as service_role (bypasses RLS).

-- ─────────────────────────────────────────
-- platform_admins
-- Your team's cross-tenant staff (support, provisioning, billing).
-- Deliberately NOT tenant-scoped. RLS is enabled with zero policies
-- for normal roles, so `authenticated`/`anon` can never read or
-- write this table — only service_role (RLS-bypass) can.
-- ─────────────────────────────────────────
create table platform_admins (
  id              uuid primary key default gen_random_uuid(),
  email           text unique not null,
  password_hash   text,
  auth_provider_id text,
  role            text not null default 'support'
                    check (role in ('super_admin','support')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger trg_touch_updated_at
  before update on platform_admins
  for each row execute function touch_updated_at();

alter table platform_admins enable row level security;
alter table platform_admins force row level security;
-- Intentionally no policies created here.

-- ─────────────────────────────────────────
-- users (tenant admin-panel accounts)
-- ─────────────────────────────────────────
create table users (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  email           text not null,
  password_hash   text,
  auth_provider_id text,
  role            text not null default 'editor'
                    check (role in ('owner','admin','editor','viewer')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (tenant_id, email)
);

create index idx_users_tenant on users (tenant_id);

select apply_tenant_rls('users');
