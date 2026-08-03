-- ═══════════════════════════════════════════════════════════
-- 018_platform_admin_hardening_and_impersonation.sql
--
-- 1. Hardens custom_access_token_hook so a platform_admin session
--    can NEVER resolve a tenant_id claim, even defensively against a
--    stray/duplicate `users` row for the same auth user id — this is
--    an explicit, unconditional guarantee, not just "shouldn't happen".
--
-- 2. Adds am_i_platform_admin() — a live (non-JWT-cached) check against
--    the platform_admins table, used as defense-in-depth by every
--    /api/platform-admin/* route in addition to the JWT claim (closes
--    the staleness gap: if a platform admin is deactivated mid-session,
--    their still-valid JWT would keep saying is_platform_admin=true for
--    up to an hour otherwise).
--
-- 3. Adds impersonation_grants — audited, time-limited "view as tenant"
--    support-access records. Deliberately has ZERO grants to
--    anon/authenticated (matches the platform_admins lockdown pattern):
--    only reachable via service_role from trusted backend route code,
--    which itself is gated behind am_i_platform_admin().
-- ═══════════════════════════════════════════════════════════

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  claims jsonb;
  v_tenant_id uuid;
  v_role text;
  v_is_platform_admin boolean;
begin
  claims := event->'claims';

  select exists(
    select 1 from public.platform_admins
    where id = (event->>'user_id')::uuid
       or email = (event->'claims'->>'email')
  ) into v_is_platform_admin;

  -- HARD INVARIANT: platform admins never get a tenant_id claim, full stop.
  -- We deliberately do not even look up `users` for this account when it is
  -- a platform_admin, so a stray/duplicate users row can never leak a
  -- tenant_id onto a platform_admin's session.
  if not v_is_platform_admin then
    select tenant_id, role into v_tenant_id, v_role
    from public.users
    where id = (event->>'user_id')::uuid;

    if v_tenant_id is not null then
      claims := jsonb_set(claims, '{tenant_id}', to_jsonb(v_tenant_id::text));
      claims := jsonb_set(claims, '{tenant_role}', to_jsonb(v_role));
    end if;
  end if;

  if v_is_platform_admin then
    claims := jsonb_set(claims, '{is_platform_admin}', 'true'::jsonb);
  end if;

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;


-- ── Live platform-admin check (bypasses JWT staleness) ──
create or replace function public.am_i_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.platform_admins
    where id = auth.uid()
  );
$$;

grant execute on function public.am_i_platform_admin() to authenticated;

comment on function public.am_i_platform_admin() is
  'Live (non-JWT-cached) check of whether the calling session belongs to an active platform_admin. Used as defense-in-depth by every /api/platform-admin/* route on top of the is_platform_admin JWT claim.';


-- ── Impersonation grants (audited "view as tenant" support access) ──
create table impersonation_grants (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references tenants(id) on delete cascade,
  platform_admin_id   uuid not null references platform_admins(id) on delete cascade,
  reason              text not null,
  created_at          timestamptz not null default now(),
  expires_at          timestamptz not null,
  revoked_at          timestamptz
);

create index idx_impersonation_grants_active
  on impersonation_grants (tenant_id, expires_at)
  where revoked_at is null;

alter table impersonation_grants enable row level security;
alter table impersonation_grants force row level security;
-- Intentionally no policies for anon/authenticated: only service_role
-- (BYPASSRLS), invoked from /api/platform-admin/* routes that have
-- already verified the caller via am_i_platform_admin(), may touch this
-- table. Matches the platform_admins lockdown pattern exactly.

revoke all on impersonation_grants from anon, authenticated;

comment on table impersonation_grants is
  'Audit trail of every "View as tenant" support-impersonation session: who, which tenant, why, and for how long. Read-only impersonation in v1 — see delivery notes for the security trade-offs of this feature.';
