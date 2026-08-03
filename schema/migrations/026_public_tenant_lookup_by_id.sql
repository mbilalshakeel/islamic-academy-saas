-- ═══════════════════════════════════════════════════════════
-- 026_public_tenant_lookup_by_id.sql
-- Companion to get_tenant_by_slug() (migration 017): a narrow, anon-
-- grantable RPC to validate a tenant_id is real/active, for routes that
-- already have an id (e.g. the Sehri/Iftar route, which receives
-- tenant_id from a client that got it from an earlier slug lookup) and
-- need to re-confirm it before minting a scoped-anon token — without
-- ever needing service_role for a task this narrow.
-- ═══════════════════════════════════════════════════════════

create or replace function public.get_tenant_by_id(p_tenant_id uuid)
returns table (id uuid, slug text, name text, status text)
language sql
stable
security definer
set search_path = public
as $$
  select t.id, t.slug, t.name, t.status
  from tenants t
  where t.id = p_tenant_id
    and t.status in ('trial', 'active')
  limit 1;
$$;

grant execute on function public.get_tenant_by_id(uuid) to anon, authenticated;

comment on function public.get_tenant_by_id(uuid) is
  'Public, narrow tenant validation by id (id/slug/name/status only). Companion to get_tenant_by_slug() for routes that already have a tenant_id and need to confirm it is real/active before minting a scoped-anon token. Underlying tenants table remains locked down from anon/authenticated via RLS.';
