# Content Management CRUD — Stage 1 & Stage 2 Delivery Notes

## STAGE 1 — Core Religious Content CRUD

### Architecture
Rather than 7 sets of near-duplicate CRUD routes, built a single **generic,
whitelist-driven CRUD API** (`/api/tenant-admin/resource/[table]`):
- `tenant-admin-tables-config.ts` explicitly declares every manageable table,
  its writable columns, required-on-create fields, sort column, and
  parent/child relationship. A table not listed here is unreachable through
  this route — there is no way to point it at an arbitrary table name.
- **This whitelist is a UX/API-shape convenience, not the tenant-isolation
  boundary.** Every table still has RLS + the `stamp_tenant_id()` trigger,
  exactly as proven in earlier phases — this route uses the same anon-key,
  session-bound Supabase client as every other tenant-admin route, never
  `service_role`.
- Every write bumps the caller's own `tenant_branding.sw_cache_version`.

Built on top: a `useResource()` client hook (load/create/update/remove/
reorder), a `ConfirmDeleteButton`, and a `DragReorderList` (native HTML5
drag-and-drop, no extra dependency) — shared across all 7 screens for
consistency.

### Screens built
1. **Quran Editions & Paras** — edition tabs, add/edit/delete/reorder 30 paras
2. **Qaida Courses** — flat list CRUD
3. **Divine Names** — category toggle (Allah/Prophet), inline edit, drag-to-reorder
4. **Dua Categories & Duas** — category tabs, add/edit/delete duas, numbered position for Kalimas
5. **Hadith Collections & Hadiths** — collection tabs, add/edit/delete
6. **Pillars & Pillar Details** — pillar tabs, editable description, reorderable detail bullets
7. **Prayers & Ritual Guides** — inline rakat-count editing, Wudu/Namaz step CRUD + reorder

### End-to-end proof (real API calls against the running app)
As Tenant A (Masjid An-Noor)'s admin:
1. **Added hadith #41** — confirmed present via GET afterward
2. **Edited "Dua e Subah"'s translation** — confirmed new text via GET
3. **Deleted "Qurani Qaida"** — qaida list went from 2 → 1
4. **Reordered Allah's Names** (swapped #1 Ar-Rahman ↔ #2 Ar-Rahim via the
   reorder endpoint) — confirmed new order via GET

**Tenant B verification (all via separate session, same requests)**: hadith
count still exactly 40 (no #41), original Dua e Subah translation unchanged,
both qaida entries still present, Allah's Names order unchanged
(Ar-Rahman #1, Ar-Rahim #2). Confirmed again at the raw database level:
`A hadiths: 41, B hadiths: 40, A qaida: 1, B qaida: 2`.

`sw_cache_version` on Tenant A's branding bumped to 5 (once per write);
Tenant B's stayed at 1.

### Bug found & fixed
The bulk **reorder** endpoint initially updated rows one-at-a-time in target
order, which could transiently violate `divine_names`' `UNIQUE(tenant_id,
category, order_index)` constraint when two positions swap. Fixed with a
two-phase update: move every affected row to a guaranteed-unique negative
placeholder first, then set final values — verified working on the actual
Ar-Rahman/Ar-Rahim swap test.

---

## STAGE 2 — New Islamic Tools Modules

### Schema
- **`tenant_settings`** (1:1) — city/country/lat/long, calculation_method,
  currency, gold/silver price per gram, optional Nisab override
- **`dhikr_items`** — admin-managed catalog; counting itself is client-side
  (localStorage), no login required for end users
- **`calendar_events`** — stored by **Hijri month/day**, not a fixed
  Gregorian date (since Hijri dates shift ~11 days earlier each Gregorian
  year) — converted to upcoming Gregorian dates at render time via
  `moment-hijri` (167K downloads/month, most widely used option evaluated)
- **`aladhan_prayer_time_cache`** — internal 24h-TTL cache table, not an
  admin content type; Sehri/Iftar timings are fetched live from the free
  [Aladhan API](https://aladhan.com/prayer-times-api) (no key required) and
  cached per-tenant, per-day
- **Zakat Calculator** — pure client-side computation, no table at all, per spec

All four added to `seed_tenant_defaults()` (except the cache table, which
has no meaningful "default" — a new tenant just starts with an empty cache).
Template tenant seeded with the 6 required default dhikr items and 13
standard Hijri calendar events (New Year, Ashura, Mawlid, Isra & Mi'raj,
Shab-e-Barat, Ramadan start, Laylat al-Qadr, Eid al-Fitr, Hajj begins, Day of
Arafah, Eid al-Adha + 2 Tashreeq days).

### Public tools (no login required)
- `/t/[slug]/tools/sehri-iftar` — shows today's Fajr/Maghrib, or a clear
  "Set your city in Settings" prompt if no location is configured (tested
  both states)
- `/t/[slug]/tools/dhikr` — Tasbih counter, target-count vibration/sound,
  localStorage persistence per tenant+dhikr
- `/t/[slug]/tools/calendar` — today's Hijri date + sorted upcoming events
  with day countdowns
- `/t/[slug]/tools/zakat` — interactive calculator, clearly labeled as an
  estimate when using fallback gold/silver prices

### Admin screens
- `/t/[slug]/admin/settings/tools` — city/country/calculation method,
  currency, gold/silver prices
- `/t/[slug]/admin/content/dhikr` and `/content/calendar` — full CRUD via
  the same generic resource API from Stage 1

### End-to-end proof
1. **Real Sehri/Iftar fetch**: set Tenant A's city to Dammam, Saudi Arabia
   via the actual settings API → first request hit Aladhan live (`fajr:
   03:34, maghrib: 18:30, source: aladhan_live`, ~570ms) → second request
   same day served from cache (~55ms, `source: cache`) → verified the cache
   row directly in `aladhan_prayer_time_cache`. Tenant B (no location set)
   correctly got `{"needs_location": true, "message": "Set your city in
   Settings..."}`, never a guessed/wrong time.
2. **Custom dhikr item**: added "La hawla wa la quwwata illa billah" as
   Tenant A's admin → immediately visible in Tenant A's public dhikr list
   (7 items) → confirmed **absent** from Tenant B's public list (still
   exactly 6) → screenshotted the live counter UI showing the new phrase
   selected by default with its Arabic text, translation, and target count.
3. **Zakat math verification**: with gold=75/g, silver=0.95/g (SAR):
   Nisab = min(85×75, 595×0.95) = min(6375, **565.25**) = 565.25.
   Sample inputs (cash=10000, gold=20g, silver=0g, investments=5000,
   debts=2000) → total = 10000+1500+0+5000-2000 = **14500**. Meets Nisab →
   Zakat = 14500 × 2.5% = **362.50**. Independently computed this by hand in
   Python, then drove the actual browser UI (Playwright) with the same
   inputs — the live app produced the **identical** `565.25 SAR` / `14500.00
   SAR` / `362.50 SAR`, screenshotted for the record.
4. **Calendar rendering**: loaded the live calendar page — showed "Today: 14
   Safar 1448 AH, Tuesday, July 28, 2026" (correct for the current date) and
   all 13 seeded events correctly converted to upcoming Gregorian dates,
   sorted chronologically with day countdowns.

### Security issue found & fixed during this stage
My first drafts of the four new **public** routes (`sehri-iftar`,
`dhikr-items`, `calendar-events`, `tenant-settings`) used
`createSupabaseServiceRoleClient()` to resolve a public slug into a tenant
id — caught immediately by the ESLint import-restriction rule built earlier
(ironically doing exactly its job on new code). Root cause: these routes
don't actually need to bypass RLS at all, only to know which tenant a
public slug belongs to. Fixed by:
- Introducing `get_tenant_by_id()` (companion to the existing
  `get_tenant_by_slug()`), both narrow, anon-grantable RPCs
- Adding a `createPlainAnonClient()` helper (the same shared, public anon
  key any browser already has) for the initial slug/id → tenant lookup
- Reserving `createSupabaseScopedAnonClient()` (mints a short-lived,
  tenant-scoped JWT, still carrying only `anon`-level Postgres privilege)
  for the actual tenant-scoped content reads/writes

Re-ran the full Stage 2 test suite after the fix — all four routes and
their functional results (cache behavior, tenant isolation, custom dhikr
visibility) are identical to before the fix; only the internal privilege
path changed. `npx eslint` now reports 0 errors project-wide, and `npm run
build` succeeds cleanly.

### Design notes
- `aladhan_prayer_time_cache` is the one table where `anon` was granted
  `INSERT/UPDATE` (not just the platform-wide `SELECT`-only default) —
  narrowly scoped to this single table, since a cache write from an
  anonymous visitor's request is a legitimate, RLS-still-enforced operation
  distinct from "editing content."
- Gold/silver prices are explicitly labeled in the UI as estimates requiring
  periodic admin updates — the app never claims real-time market accuracy.

## What's next
Batch 2 (Books, Q&A, About/Contact, Home Menu Config) intentionally not
started, per your instruction.
