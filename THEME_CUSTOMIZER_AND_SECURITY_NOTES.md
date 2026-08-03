# Delivery Notes — Soft-Delete, ESLint Guard, Theme Customizer

## 1. Soft-Delete Tenant Deletion (14-day grace period)

**Schema**: `tenants.status` now supports `pending_deletion`, plus
`deletion_requested_at`, `deletion_requested_by`, `deletion_scheduled_for`,
`status_before_deletion`. Two new SECURITY DEFINER functions —
`soft_delete_tenant()` and `restore_tenant()` — are granted **only to
`service_role`** (revoked from `authenticated`/`anon`/`public`), so the real
access boundary is "can this code path be reached at all" (enforced by
`requirePlatformAdmin()` in the calling route), not a role check baked into
the function itself — a lesson learned the hard way (see Bugs Found below).

**Flow**:
- Dashboard "Delete" → `soft_delete_tenant()` → tenant hidden from normal
  listing, visible in a dedicated "Pending Deletion" section with a live
  countdown, **zero data touched**.
- "Restore" → `restore_tenant()` → instant, lossless undo — returns tenant to
  whatever status it had *before* deletion was requested (tested: a
  suspended tenant soft-deleted and restored comes back `suspended`, not
  silently reactivated).
- Expiry → `hard_delete_expired_tenants()`, invoked via
  `/api/platform-admin/cron/hard-delete-expired-tenants` (gated by a shared
  `X-Cron-Secret` header, meant to be called by an external daily
  scheduler). This orchestration route cleans up each tenant's GoTrue auth
  accounts **first** (external system, can't participate in the Postgres
  cascade), then calls the SQL function that performs the actual
  irreversible `DELETE FROM tenants`.

**Proven end-to-end** (all via real API calls against the running app):
1. Soft-deleted a test tenant → confirmed it vanished from the normal
   dashboard listing, appeared in the pending-deletion view with a
   `2026-08-11` scheduled date (exactly 14 days out), all 40 hadiths / 45
   duas / 1 admin / 1 branding row still present and untouched.
2. Restored it → reappeared in normal listing instantly, bookkeeping columns
   fully cleared.
3. Repeated with a suspended tenant → confirmed restore returns it to
   `suspended`, not `active`.
4. Soft-deleted again, manually backdated `deletion_scheduled_for` to
   simulate 14 days passing, called the real cron endpoint → tenant and its
   GoTrue auth user were both permanently removed; re-checking the database
   showed 0 rows remaining anywhere for that tenant id.

## 2. ESLint Import Restriction on `service-role.ts`

Added `.eslintrc.json` (none existed before, since the project was scaffolded
by hand) with a `no-restricted-imports` rule scoped via an `overrides` block
that applies to every `.ts`/`.tsx` file **except** those under
`src/app/api/platform-admin/**`.

**Proven**: created a deliberate bad-import test file
(`src/app/api/tenant-admin/bad-import-test/route.ts`) importing
`service-role.ts` from outside the allowed directory —
`npx eslint src/` failed with a clear, actionable error message and exit
code 1 (would break `npm run lint` / CI). Confirmed no false positives by
linting the legitimate `platform-admin/**` usages (clean). Removed the test
file afterward; full project lints clean (0 errors) and `npm run build`
succeeds.

## 3. Theme Customizer (Part A) — built and proven in isolation

**Schema additions**: `tenant_branding` gained `text_color_hex`, `ui_font`,
`arabic_font`, `urdu_font`, `dark_mode_default`, `preset_theme_key`. Preset
themes (8 total) are a fixed frontend catalog, not a DB table — applying one
is just setting 4 color values in one click.

**Storage**: new `branding-assets` bucket (public read, 2MB limit, PNG/JPEG/
SVG/ICO only). Write access is gated by RLS on `storage.objects`, keyed on
the same `current_tenant_id()` mechanism used everywhere else — a tenant can
only write under a path prefixed by their own `tenant_id`
(`<tenant_id>/logo-*.png`).

**UI** (`/t/[slug]/admin/settings/theme`): preset swatches, manual color
pickers (primary/secondary/background/text) with a live preview pane
(header, buttons, sample Arabic/Urdu text, cards) that updates instantly on
every change — no save required to preview. Font dropdowns (UI/Arabic/Urdu),
drag-and-drop logo upload + separate favicon upload, light/dark default
toggle, and a Save button that PUTs the whole form and bumps
`sw_cache_version`.

**Proven end-to-end**, driven through the real browser via Playwright
(screenshots in `screenshots/theme_*.png`):
1. Logged in as Masjid An-Noor's real admin via the actual `/login` page.
2. Opened the Theme Customizer — confirmed it loaded that tenant's actual
   branding row (previously set via API to Royal Purple/Poppins/dark-mode,
   from an earlier test — shown correctly).
3. Clicked the "Emerald" preset swatch — live preview updated **instantly**
   (header, both buttons, Quran/Hadith card icons) with zero save needed.
4. Changed the app name field, clicked **Save Theme** — got a real success
   message: "Saved at 9:43:20 AM — cache version bumped to 3".
5. **Database verification**: Tenant A's row shows
   `app_name = "Masjid An-Noor — Live Demo"`, `primary_color_hex = #059669`,
   `ui_font = Poppins`, `dark_mode_default = true`,
   `sw_cache_version = 3`. Tenant B's row, queried in the same statement,
   remains **completely untouched**: `Islamic Coaching Institute`,
   `#0284C7`, `Inter`, `false`, `sw_cache_version = 1`.
6. Also tested the upload path directly: uploaded a real PNG via the actual
   upload route as Tenant A → file landed at
   `branding-assets/<tenant-A-id>/logo-*.png` and was publicly fetchable
   (200, `image/png`). Uploaded again as Tenant B via the identical
   route → landed under Tenant B's own prefix, never Tenant A's (the route
   derives the path from the session's own tenant_id, never client input).
   Additionally proved the underlying **Storage RLS policy** itself blocks a
   forged cross-tenant write: a raw SQL attempt to insert a
   `storage.objects` row under Tenant A's prefix while impersonating Tenant
   B's session was rejected with `"new row violates row-level security
   policy"` — defense-in-depth below the application layer.

## Bugs found and fixed during this work (flagged for visibility)

1. **`soft_delete_tenant()`/`restore_tenant()` initially checked
   `am_i_platform_admin()` internally**, which relies on `auth.uid()` —
   meaningless under the `service_role` context these functions are actually
   called from (no single "current end-user" in a service-role request).
   Worse, my first fix (checking that `p_requested_by` is *a* platform admin,
   granted to `authenticated`) would have let any authenticated tenant admin
   call the RPC directly via PostgREST with a real platform admin's id
   forged into the parameter. Fixed by revoking `authenticated`/`anon`
   entirely and granting only to `service_role` — the real boundary is
   reachability, enforced one layer up by `requirePlatformAdmin()`.
2. **Branding `PUT` failed with "UPDATE requires a WHERE clause"** —
   PostgREST's safety guard against unrestricted updates. Fixed by adding an
   explicit `.eq("tenant_id", tenantId)` filter (using the guard's
   session-derived tenant id, never client input) — RLS was already the real
   protection, this was purely to satisfy PostgREST's guard rail.
3. **`tenant_branding` INSERT vs UPSERT clash** (carried over from the
   previous session's Super Admin work) was already fixed prior to this
   round, but is mentioned here since it's adjacent to the branding work
   touched today.

## What's next

Per your instruction, content management CRUD screens are intentionally
**not started yet** — Part A (Theme Customizer) is complete and proven in
isolation. Ready for the next part of the Institute Admin Panel whenever
you give the go-ahead.
