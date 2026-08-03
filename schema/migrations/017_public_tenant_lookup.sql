-- ═══════════════════════════════════════════════════════════
-- 017_public_tenant_lookup.sql
-- Narrow, purpose-built RPC to resolve a tenant's identity from its
-- public slug — needed by middleware BEFORE a request has any
-- tenant_id claim (anonymous visitors, and the initial slug check
-- during login). Deliberately exposes only {id, slug, name, status},
-- never the full `tenants` row, and the underlying table keeps its
-- RLS lockdown (zero anon grants) exactly as designed.
-- ═══════════════════════════════════════════════════════════

create or replace function public.get_tenant_by_slug(p_slug text)
returns table (id uuid, slug text, name text, status text)
language sql
stable
security definer
set search_path = public
as $$
  select t.id, t.slug, t.name, t.status
  from tenants t
  where t.slug = p_slug
    and t.status in ('trial', 'active')
  limit 1;
$$;

grant execute on function public.get_tenant_by_slug(text) to anon, authenticated;

comment on function public.get_tenant_by_slug(text) is
  'Public, narrow tenant-directory lookup by slug (id/slug/name/status only). Used by middleware to resolve tenant identity before any tenant_id claim exists on the request. Underlying tenants table remains locked down from anon/authenticated via RLS.';
