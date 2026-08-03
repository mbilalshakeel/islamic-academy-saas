-- ═══════════════════════════════════════════════════════════
-- 021_branding_assets_storage.sql
-- Supabase Storage bucket + RLS policies for tenant logo/favicon
-- uploads (Theme Customizer). Files are stored under a path
-- prefixed by the tenant's own id (e.g. "<tenant_id>/logo.png"),
-- and RLS on storage.objects enforces that a tenant admin can only
-- read/write/delete objects under THEIR OWN tenant_id prefix —
-- same current_tenant_id() mechanism used everywhere else in this
-- project, just applied to storage.objects instead of a content table.
--
-- The bucket is PUBLIC for reads (branding assets need to be servable
-- to anonymous PWA visitors — a mosque's logo isn't sensitive data),
-- but writes are still gated by the same tenant-ownership check.
-- ═══════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'branding-assets',
  'branding-assets',
  true,
  2097152, -- 2 MB
  array['image/png', 'image/jpeg', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']
)
on conflict (id) do nothing;

-- Anyone (including anonymous PWA visitors) can READ branding assets —
-- this is public-facing content (logos/favicons), not tenant-private data.
create policy branding_assets_public_read on storage.objects
  for select
  using (bucket_id = 'branding-assets');

-- A tenant admin may INSERT/UPDATE/DELETE only objects whose path starts
-- with their own tenant_id — storage.foldername(name)[1] is the first
-- path segment, i.e. our convention of "<tenant_id>/filename.ext".
create policy branding_assets_tenant_write on storage.objects
  for insert
  with check (
    bucket_id = 'branding-assets'
    and (storage.foldername(name))[1] = current_tenant_id()::text
  );

create policy branding_assets_tenant_update on storage.objects
  for update
  using (
    bucket_id = 'branding-assets'
    and (storage.foldername(name))[1] = current_tenant_id()::text
  );

create policy branding_assets_tenant_delete on storage.objects
  for delete
  using (
    bucket_id = 'branding-assets'
    and (storage.foldername(name))[1] = current_tenant_id()::text
  );
