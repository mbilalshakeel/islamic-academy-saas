-- ═══════════════════════════════════════════════════════════
-- 016_custom_access_token_hook.sql
-- Supabase Auth "Custom Access Token" hook. GoTrue calls this
-- function right before minting a JWT for a session (on login,
-- token refresh, etc.) and merges whatever claims it returns into
-- the token. This is how a tenant admin's `tenant_id` and `role`
-- get baked into their JWT automatically — no client-side trust
-- required, and it's exactly what current_tenant_id() reads via
-- request.jwt.claims ->> 'tenant_id'.
--
-- Lookup path: auth.users.id -> public.users.id (1:1, same UUID)
--   -> public.users.tenant_id / role
--
-- A user with no matching `users` row (e.g. a platform_admin, who
-- deliberately has no tenant) gets no tenant_id claim at all —
-- current_tenant_id() then resolves to NULL and RLS denies all
-- tenant-scoped rows, which is the correct default-deny behavior.
-- ═══════════════════════════════════════════════════════════

-- SECURITY DEFINER is required here: GoTrue calls this function as the
-- supabase_auth_admin role, which does NOT have BYPASSRLS. Because
-- users/platform_admins both have FORCE ROW LEVEL SECURITY, a plain
-- SECURITY INVOKER function would be blocked from reading them at the
-- exact moment we need to look up the tenant_id to put IN the token
-- (chicken-and-egg: no tenant claim exists yet on this request). Running
-- as SECURITY DEFINER (owned by a bypass-RLS role, e.g. postgres) lets
-- the lookup succeed regardless of caller privileges.
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

  select tenant_id, role into v_tenant_id, v_role
  from public.users
  where id = (event->>'user_id')::uuid;

  select exists(
    select 1 from public.platform_admins
    where id = (event->>'user_id')::uuid
       or email = (event->'claims'->>'email')
  ) into v_is_platform_admin;

  if v_tenant_id is not null then
    claims := jsonb_set(claims, '{tenant_id}', to_jsonb(v_tenant_id::text));
    claims := jsonb_set(claims, '{tenant_role}', to_jsonb(v_role));
  end if;

  if v_is_platform_admin then
    claims := jsonb_set(claims, '{is_platform_admin}', 'true'::jsonb);
  end if;

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

-- GoTrue calls this as the supabase_auth_admin role; it needs
-- explicit execute + read access regardless of RLS on users/platform_admins.
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;

grant select on public.users to supabase_auth_admin;
grant select on public.platform_admins to supabase_auth_admin;

comment on function public.custom_access_token_hook(jsonb) is
  'GoTrue Custom Access Token Hook: injects tenant_id, tenant_role, and is_platform_admin claims into every JWT based on the public.users / public.platform_admins tables.';
