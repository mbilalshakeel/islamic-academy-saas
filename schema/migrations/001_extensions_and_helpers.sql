-- ═══════════════════════════════════════════════════════════
-- 001_extensions_and_helpers.sql
-- Extensions, tenant-identity resolution, and reusable RLS/trigger
-- helper applied to every tenant-scoped content table.
-- ═══════════════════════════════════════════════════════════

create extension if not exists pgcrypto;   -- gen_random_uuid()

-- ─────────────────────────────────────────
-- current_tenant_id()
-- Resolves the active tenant from the request's JWT claim
-- (Supabase-style: request.jwt.claims ->> 'tenant_id'), falling
-- back to a session GUC (app.tenant_id) for plain-Postgres /
-- background-job contexts (e.g. migration scripts, cron jobs).
-- ─────────────────────────────────────────
create or replace function current_tenant_id()
returns uuid
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id', ''),
    nullif(current_setting('app.tenant_id', true), '')
  )::uuid
$$;

comment on function current_tenant_id() is
  'Returns the tenant_id of the currently authenticated session. Source of truth for all RLS policies.';

-- ─────────────────────────────────────────
-- stamp_tenant_id()
-- BEFORE INSERT trigger, defense-in-depth on top of RLS's WITH CHECK
-- clauses. Behavior depends on the calling role:
--
--   - Normal, RLS-bound app roles (authenticated / anon): tenant_id
--     is ALWAYS force-overwritten with the session's own tenant,
--     regardless of what the client payload contains. These roles
--     can never insert a row tagged with a different tenant.
--
--   - Trusted backend/service roles that have BYPASSRLS (e.g.
--     Supabase's service_role, or whatever role runs tenant
--     provisioning / seeding / migrations): tenant_id is taken as
--     explicitly provided by the caller instead, since these
--     operations legitimately write rows for a tenant that is NOT
--     "the current session's own tenant" (there often is no
--     request-scoped tenant at all in a backend job). Such a role
--     MUST supply tenant_id explicitly; the function raises if it
--     doesn't, rather than silently defaulting to NULL.
--
-- This distinction is required for seed_tenant_defaults() and the
-- initial template-tenant data load to function at all — without
-- it, this trigger would silently null out every tenant_id on any
-- insert performed outside of a real end-user session.
-- ─────────────────────────────────────────
create or replace function stamp_tenant_id()
returns trigger
language plpgsql
as $$
declare
  v_bypasses_rls boolean;
begin
  select rolbypassrls into v_bypasses_rls
  from pg_roles
  where rolname = current_user;

  if coalesce(v_bypasses_rls, false) then
    if new.tenant_id is null then
      raise exception
        'tenant_id must be explicitly provided when inserting into % as a RLS-bypass role (%).',
        tg_table_name, current_user;
    end if;
    return new;
  end if;

  new.tenant_id := current_tenant_id();
  return new;
end;
$$;

comment on function stamp_tenant_id() is
  'For normal app roles, forces tenant_id to the session tenant (anti-spoofing). For trusted RLS-bypass roles (service/seeding/migrations), requires tenant_id to be explicitly provided instead.';

-- ─────────────────────────────────────────
-- touch_updated_at()
-- Generic BEFORE UPDATE trigger to auto-maintain updated_at.
-- ─────────────────────────────────────────
create or replace function touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ─────────────────────────────────────────
-- apply_tenant_rls(target_table)
-- Idempotently applies the standard multi-tenant RLS policy set
-- + tenant-stamping trigger + updated_at trigger to any table
-- that has tenant_id, created_at and updated_at columns.
-- Call this once at the end of every content-table migration.
-- ─────────────────────────────────────────
create or replace function apply_tenant_rls(target_table regclass)
returns void
language plpgsql
as $$
begin
  execute format('alter table %s enable row level security', target_table);
  execute format('alter table %s force row level security', target_table);

  execute format('drop policy if exists tenant_read on %s', target_table);
  execute format(
    'create policy tenant_read on %s for select using (tenant_id = current_tenant_id())',
    target_table
  );

  execute format('drop policy if exists tenant_insert on %s', target_table);
  execute format(
    'create policy tenant_insert on %s for insert with check (tenant_id = current_tenant_id())',
    target_table
  );

  execute format('drop policy if exists tenant_update on %s', target_table);
  execute format(
    'create policy tenant_update on %s for update using (tenant_id = current_tenant_id()) with check (tenant_id = current_tenant_id())',
    target_table
  );

  execute format('drop policy if exists tenant_delete on %s', target_table);
  execute format(
    'create policy tenant_delete on %s for delete using (tenant_id = current_tenant_id())',
    target_table
  );

  execute format('drop trigger if exists trg_stamp_tenant_id on %s', target_table);
  execute format(
    'create trigger trg_stamp_tenant_id before insert on %s for each row execute function stamp_tenant_id()',
    target_table
  );

  execute format('drop trigger if exists trg_touch_updated_at on %s', target_table);
  execute format(
    'create trigger trg_touch_updated_at before update on %s for each row execute function touch_updated_at()',
    target_table
  );
end;
$$;

comment on function apply_tenant_rls(regclass) is
  'Applies standard tenant-isolation RLS policies + tenant-id stamping trigger + updated_at trigger to a content table. Table must have tenant_id, created_at, updated_at columns.';
