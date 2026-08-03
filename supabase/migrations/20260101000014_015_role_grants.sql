-- ═══════════════════════════════════════════════════════════
-- 015_role_grants.sql
-- Tightens table-level GRANTs so that Postgres role privileges
-- match our intended access model, with RLS as the tenant-isolation
-- layer on top:
--
--   anon           -> PUBLIC PWA visitors. Read-only on published
--                     content tables. Zero access to tenants, users,
--                     platform_admins (no legitimate anonymous use
--                     case ever touches those tables).
--
--   authenticated  -> Tenant admin-panel users (owner/admin/editor/
--                     viewer, tracked in the `users` table + JWT
--                     claims). Full CRUD on content tables, gated by
--                     RLS to their own tenant_id. Can read/update
--                     their own tenant row and their own user row.
--                     Fine-grained owner/admin/editor/viewer write
--                     permissions (e.g. "viewer cannot INSERT") are
--                     enforced at the RLS-policy / application layer
--                     in a later phase — this migration establishes
--                     the coarse (anon vs authenticated) boundary
--                     Supabase's default grants do not.
--
--   service_role   -> Already has BYPASSRLS + implicit full access
--                     via Postgres role membership; no changes
--                     needed here. Used only by trusted backend
--                     code (tenant provisioning, seeding), never
--                     shipped to the browser or the admin panel.
-- ═══════════════════════════════════════════════════════════

-- ── Content tables: anon gets SELECT only, authenticated keeps full CRUD ──
do $$
declare
  t text;
  content_tables text[] := array[
    'quran_editions','quran_paras','qaida_courses',
    'divine_names',
    'dua_categories','duas',
    'hadith_collections','hadiths','books',
    'pillars','pillar_details','pillar_guide_steps',
    'prayers','ritual_guides','ritual_guide_steps',
    'qa_items',
    'site_pages','contact_channels',
    'home_menu_items',
    'tenant_branding','tenant_pwa_icons'
  ];
begin
  foreach t in array content_tables loop
    execute format('revoke insert, update, delete, truncate on %I from anon', t);
    execute format('grant select on %I to anon', t);
  end loop;
end $$;

-- ── tenants: anon has zero access; authenticated limited to its own row (handled by RLS policies already) ──
revoke all on tenants from anon;

-- ── users: anon has zero access ──
revoke all on users from anon;

-- ── platform_admins: neither anon nor authenticated get anything (service_role/bypass-RLS only) ──
revoke all on platform_admins from anon;
revoke all on platform_admins from authenticated;

-- ── Make sure future tables created by migrations inherit this same anon-read-only default ──
alter default privileges in schema public
  revoke insert, update, delete, truncate on tables from anon;
alter default privileges in schema public
  grant select on tables to anon;
