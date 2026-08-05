-- ═══════════════════════════════════════════════════════════════
-- restore_test_tenants.sql
-- Re-creates Tenant A (Masjid An-Noor) and Tenant B (Darul Uloom)
-- with their exact documented UUIDs/slugs, seeds full default content
-- via seed_tenant_defaults(), then applies the previous-session
-- branding fingerprints (colors) so before/after PWA comparisons
-- are meaningful.
-- Run as postgres (bypasses RLS).
-- ═══════════════════════════════════════════════════════════════

-- ---- Tenant A : Masjid An-Noor ----
insert into public.tenants (id, slug, name, status, plan, timezone, default_language)
values (
  '7fe561ed-c2dc-4424-ab44-c6f8a4f58c67',
  'masjid-noor',
  'Masjid An-Noor',
  'active',
  'pro',
  'Asia/Riyadh',
  'en'
) on conflict (id) do update set name = excluded.name, status = 'active';

select public.seed_tenant_defaults('7fe561ed-c2dc-4424-ab44-c6f8a4f58c67');

-- Tenant A branding fingerprint (previous session): amethyst primary #7C3AED
update public.tenant_branding set
  app_name = 'Masjid An-Noor',
  short_name = 'Masjid Noor',
  tagline = 'Light of the Community',
  primary_color_hex = '#7C3AED',
  secondary_color_hex = '#0F9C8F',
  background_color = '#FAF9FF',
  text_color_hex = '#201B33',
  preset_theme_key = 'amethyst',
  sw_cache_version = '1'
where tenant_id = '7fe561ed-c2dc-4424-ab44-c6f8a4f58c67';

-- ---- Tenant B : Darul Uloom Academy ----
insert into public.tenants (id, slug, name, status, plan, timezone, default_language)
values (
  'a5ad4866-30d4-4b84-9d86-78f839991796',
  'darul-uloom',
  'Darul Uloom Academy',
  'active',
  'pro',
  'Asia/Riyadh',
  'en'
) on conflict (id) do update set name = excluded.name, status = 'active';

select public.seed_tenant_defaults('a5ad4866-30d4-4b84-9d86-78f839991796');

-- Tenant B branding fingerprint (previous session): teal primary #059669
update public.tenant_branding set
  app_name = 'Darul Uloom Academy',
  short_name = 'Darul Uloom',
  tagline = 'Knowledge & Piety',
  primary_color_hex = '#059669',
  secondary_color_hex = '#D97706',
  background_color = '#F6FBF8',
  text_color_hex = '#0B1F16',
  preset_theme_key = 'zaytun_green',
  sw_cache_version = '1'
where tenant_id = 'a5ad4866-30d4-4b84-9d86-78f839991796';

-- ---- status report ----
select slug, name, status from public.tenants order by slug;
