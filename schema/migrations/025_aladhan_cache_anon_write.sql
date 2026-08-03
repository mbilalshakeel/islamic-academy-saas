-- ═══════════════════════════════════════════════════════════
-- 025_aladhan_cache_anon_write.sql
-- The Sehri/Iftar public API route is used by ANONYMOUS PWA visitors
-- (no login required), and needs to WRITE the 24h cache row after
-- fetching from Aladhan — unlike every other table, anon here needs
-- INSERT/UPDATE, not just SELECT (which is all migration 015's default
-- privileges granted). This is a narrow, deliberate exception scoped to
-- exactly one table, for exactly the reason that a cache write is not
-- "content" in the admin-managed sense the SELECT-only default assumes.
-- RLS (tenant_id = current_tenant_id()) still fully applies — an
-- anonymous visitor can only read/write the cache row for the tenant
-- their own session/request is scoped to, never another tenant's.
-- ═══════════════════════════════════════════════════════════

grant insert, update on aladhan_prayer_time_cache to anon;
