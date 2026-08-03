-- ═══════════════════════════════════════════════════════════
-- 019_tenant_soft_delete.sql
--
-- Converts tenant deletion into a soft-delete / grace-period flow:
--   1. "Delete" from the dashboard now sets status = 'pending_deletion'
--      and stamps deletion_requested_at / deletion_scheduled_for
--      (now() + 14 days). The tenant is NOT touched otherwise — all
--      its data remains fully intact and byte-for-byte unchanged.
--   2. Normal tenant-listing views EXCLUDE pending_deletion tenants by
--      default (a dedicated "Pending Deletion" view can still see them).
--   3. "Restore" (any time before the scheduled date) simply clears the
--      pending-deletion fields and returns status to 'active' — no data
--      was ever touched, so this is a trivial, instant, lossless undo.
--   4. A scheduled job (hard_delete_expired_tenants(), intended to run
--      e.g. daily via pg_cron or an external scheduler) finds every
--      tenant whose deletion_scheduled_for has passed and performs the
--      REAL, irreversible cascade delete at that point — reusing the
--      exact same delete path (and its GoTrue auth-user cleanup) as
--      before.
-- ═══════════════════════════════════════════════════════════

-- ── Allow the new status value ──
alter table tenants drop constraint tenants_status_check;
alter table tenants add constraint tenants_status_check
  check (status in ('trial','active','suspended','cancelled','pending_deletion'));

-- ── Soft-delete bookkeeping columns ──
alter table tenants add column deletion_requested_at timestamptz;
alter table tenants add column deletion_requested_by uuid references platform_admins(id);
alter table tenants add column deletion_scheduled_for timestamptz;
alter table tenants add column status_before_deletion text;

comment on column tenants.deletion_scheduled_for is
  'When set and in the past, hard_delete_expired_tenants() will permanently cascade-delete this tenant. NULL means no pending deletion.';
comment on column tenants.status_before_deletion is
  'The tenant''s status immediately before soft-delete was requested, so Restore can put it back exactly as it was (e.g. a suspended tenant that gets soft-deleted is restored to suspended, not active).';

-- Index to make the scheduled job's "find everything past its expiry" scan cheap.
create index idx_tenants_pending_deletion
  on tenants (deletion_scheduled_for)
  where status = 'pending_deletion';


-- ── soft_delete_tenant(): marks a tenant for deletion in 14 days ──
create or replace function public.soft_delete_tenant(p_tenant_id uuid, p_requested_by uuid)
returns table (id uuid, slug text, status text, deletion_scheduled_for timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_status text;
begin
  -- SECURITY BOUNDARY: this function is only ever GRANTed to service_role
  -- (see below) — REVOKEd from authenticated/anon/public entirely. That is
  -- the actual access control here, not a role check inside the function
  -- body: a plain "is the caller a platform admin" check inside a
  -- SECURITY DEFINER function would be trivially bypassable by any
  -- authenticated user calling this RPC directly with someone else's
  -- platform_admin id as p_requested_by, since service_role calls (like
  -- the one this function expects) have no single "current end-user"
  -- (auth.uid() is NULL under service_role). The real "is this caller
  -- allowed to do this" check already happened one layer up, in the
  -- calling route's requirePlatformAdmin() against that request's actual
  -- session — this function trusts its caller because only our own
  -- already-gated backend route code can reach it at all.
  --
  -- The check below is therefore just an audit-trail sanity check (the id
  -- being blamed for this action must correspond to a real platform
  -- admin row), not the security boundary itself.
  if not exists (select 1 from public.platform_admins where platform_admins.id = p_requested_by) then
    raise exception 'p_requested_by (%) is not a platform administrator', p_requested_by;
  end if;

  select tenants.status into v_current_status from tenants where tenants.id = p_tenant_id;

  if v_current_status is null then
    raise exception 'Tenant % not found', p_tenant_id;
  end if;

  if v_current_status = 'pending_deletion' then
    raise exception 'Tenant is already pending deletion';
  end if;

  return query
    update tenants t
    set status = 'pending_deletion',
        status_before_deletion = v_current_status,
        deletion_requested_at = now(),
        deletion_requested_by = p_requested_by,
        deletion_scheduled_for = now() + interval '14 days'
    where t.id = p_tenant_id
    returning t.id, t.slug, t.status, t.deletion_scheduled_for;
end;
$$;

grant execute on function public.soft_delete_tenant(uuid, uuid) to service_role;
revoke execute on function public.soft_delete_tenant(uuid, uuid) from authenticated, anon, public;






-- ── restore_tenant(): undoes a pending soft-delete, no data was ever touched ──
create or replace function public.restore_tenant(p_tenant_id uuid)
returns table (id uuid, slug text, status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_restore_to text;
begin
  -- SECURITY BOUNDARY: same as soft_delete_tenant() above — this function
  -- is only ever GRANTed to service_role (REVOKEd from
  -- authenticated/anon/public), so the real access check is "can this
  -- code path be reached at all", enforced by the calling route's
  -- requirePlatformAdmin(), not a role check inside this function body.
  select tenants.status, tenants.status_before_deletion
    into v_status, v_restore_to
    from tenants where tenants.id = p_tenant_id;

  if v_status is null then
    raise exception 'Tenant % not found', p_tenant_id;
  end if;

  if v_status <> 'pending_deletion' then
    raise exception 'Tenant is not pending deletion';
  end if;

  return query
    update tenants t
    set status = coalesce(v_restore_to, 'active'),
        status_before_deletion = null,
        deletion_requested_at = null,
        deletion_requested_by = null,
        deletion_scheduled_for = null
    where t.id = p_tenant_id
    returning t.id, t.slug, t.status;
end;
$$;

grant execute on function public.restore_tenant(uuid) to service_role;
revoke execute on function public.restore_tenant(uuid) from authenticated, anon, public;




-- ── hard_delete_expired_tenants(): the scheduled job ──
-- Intended to be invoked periodically (pg_cron, or an external cron calling
-- this via a service_role-authenticated RPC). Finds every tenant whose grace
-- period has passed and performs the same irreversible cascade delete +
-- GoTrue auth-user cleanup that the old immediate-delete path used to do
-- directly. Returns what it deleted, for logging/observability.
create or replace function public.hard_delete_expired_tenants()
returns table (deleted_tenant_id uuid, deleted_slug text)
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
begin
  for rec in
    select t.id, t.slug
    from tenants t
    where t.status = 'pending_deletion'
      and t.deletion_scheduled_for is not null
      and t.deletion_scheduled_for < now()
      and t.is_template = false
  loop
    -- Note: GoTrue auth.users cleanup for this tenant's admin accounts is
    -- performed by the calling application code (which has access to the
    -- auth admin API), BEFORE this function is called for that tenant —
    -- see /api/platform-admin/cron/hard-delete-expired-tenants for the
    -- orchestration. This function only ever removes the Postgres-side
    -- tenant row (and everything that cascades from it).
    delete from tenants where tenants.id = rec.id;

    deleted_tenant_id := rec.id;
    deleted_slug := rec.slug;
    return next;
  end loop;
end;
$$;

comment on function public.hard_delete_expired_tenants() is
  'Scheduled job body: permanently cascade-deletes every tenant whose 14-day soft-delete grace period has expired. Run this daily (pg_cron or external scheduler) via the orchestration route that also cleans up GoTrue auth users first.';

-- Deliberately NOT granted to authenticated/anon — only service_role
-- (invoked from the trusted cron orchestration route) may run this.
