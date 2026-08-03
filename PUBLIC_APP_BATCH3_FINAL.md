# Public App — Batch 3 (Books, Q&A, About, Contact, Islamic Tools) — FINAL

**The entire Public App is now complete.** This document covers Batch 3's
new work plus the full 20-route × 2-tenant final walkthrough.

## What was built in Batch 3

1. **Islamic Books** (`/t/[slug]/books`) — replaced the home-screen-only
   stub with a real browsable grid: title/author/description/category/
   language tags/cover gradient, tapping opens `file_reference` (Google
   Drive or URL) in a new tab, or shows "Coming soon — no file linked yet"
   for the (currently all, in test data) books without one. Home screen's
   book strip now links through to this page instead of being a dead end.
2. **Q&A** (`/t/[slug]/qa`) — replaced the plain `<details>` list with a
   proper accordion + category filter tabs (All/Namaz/Quran/Roza/Zakat/
   Aqaid), matching the admin panel's own category set exactly.
3. **About Us** (`/t/[slug]/about`) — rebuilt to handle **every** block
   type the `PageEditor` admin screen supports: `paragraph`, `tags`,
   `offerings` (now visually distinct — pills vs. checkmarked list),
   `list`, `developer` (credit card), `footer_note`, `copyright`, and
   `version` (shown as a hero badge). The old version silently dropped
   `list` blocks and rendered `tags`/`offerings` identically.
4. **Contact Us** (`/t/[slug]/contact`) — rebuilt with sensible grouping:
   Direct Contact (phone/whatsapp/email tap-to-call/message/email,
   address as plain text), Social Media (with per-platform icons),
   Working Hours (Sunday/Closed shown in red).
5. **Islamic Tools** (Sehri/Iftar, Dhikr Counter, Hijri Calendar, Zakat
   Calculator) — confirmed these were functionally complete from Stage 2
   but **visually inconsistent**: each had its own `min-h-screen` wrapper
   with hardcoded colors (`bg-slate-50`, `bg-sky-600`, etc.), rendering
   *outside* the shared tenant header/nav entirely. Repolished all 4 to
   use `var(--tenant-primary)`/`var(--tenant-secondary)` and removed the
   redundant wrapper, so they now inherit the shared `(public)` layout's
   themed header + nav like every other screen. The underlying data
   logic (Aladhan fetch/cache, dhikr localStorage counting, Hijri date
   math, Zakat formula) was untouched — verified identical results
   before/after (e.g. Zakat Nisab still `565.25 SAR-FINAL-TEST`).
6. **Home Hero** — confirmed and fixed: the Bismillah banner was reading
   `tenant_branding.tagline` (a Theme Customizer field), **not**
   `site_pages(page_key='home_hero')` (the actual Home Hero admin screen)
   at all. Fixed to read `hero_subtitle` from `site_pages`, falling back
   to the branding tagline only if a tenant has never touched Home Hero,
   then to a generic default. Verified: Tenant A's edited subtitle
   ("Walkthrough Edited Home Subtitle", set via the admin panel in an
   earlier phase) now correctly appears on the live home page.

## Final walkthrough — every route, both tenants

All 20 routes tested against **both** `masjid-noor` and `darul-uloom`
(40 checks total) via direct HTTP requests (not just visual spot-checks):

| # | Screen | Route | Tenant A | Tenant B |
|---|---|---|---|---|
| 1 | Home | `/t/[slug]` | ✅ PASS | ✅ PASS |
| 2 | Quran 16-line list | `/t/[slug]/quran/16-line` | ✅ PASS | ✅ PASS |
| 3 | Quran 16-line Para viewer | `/t/[slug]/quran/16-line/1` | ✅ PASS | ✅ PASS |
| 4 | Quran 15-line list | `/t/[slug]/quran/15-line` | ✅ PASS | ✅ PASS |
| 5 | Qaida selection | `/t/[slug]/qaida` | ✅ PASS | ✅ PASS |
| 6 | Allah's Names | `/t/[slug]/names/allah` | ✅ PASS | ✅ PASS |
| 7 | Prophet's Names | `/t/[slug]/names/prophet` | ✅ PASS | ✅ PASS |
| 8 | Duas menu | `/t/[slug]/duas` | ✅ PASS | ✅ PASS |
| 9 | Masnoon Duas (list_screen) | `/t/[slug]/duas/masnoon` | ✅ PASS | ✅ PASS |
| 10 | Kalimas / Ayat-ul-Kursi / Dua-e-Qunoot / Iman-e-Mujmal / Iman-e-Mufassal | modals within Duas menu | ✅ PASS (Kalimas verified by screenshot) | ✅ PASS |
| 11 | Hadith | `/t/[slug]/hadith` | ✅ PASS | ✅ PASS |
| 12 | Pillars | `/t/[slug]/pillars` | ✅ PASS | ✅ PASS |
| 13 | Prayers | `/t/[slug]/prayers` | ✅ PASS | ✅ PASS |
| 14 | Books | `/t/[slug]/books` | ✅ PASS | ✅ PASS |
| 15 | Q&A | `/t/[slug]/qa` | ✅ PASS | ✅ PASS |
| 16 | About | `/t/[slug]/about` | ✅ PASS | ✅ PASS |
| 17 | Contact | `/t/[slug]/contact` | ✅ PASS | ✅ PASS |
| 18 | Sehri/Iftar | `/t/[slug]/tools/sehri-iftar` | ✅ PASS | ✅ PASS |
| 19 | Dhikr Counter | `/t/[slug]/tools/dhikr` | ✅ PASS | ✅ PASS |
| 20 | Hijri Calendar | `/t/[slug]/tools/calendar` | ✅ PASS | ✅ PASS |
| 21 | Zakat Calculator | `/t/[slug]/tools/zakat` | ✅ PASS | ✅ PASS |

**Automated check result: 40/40 routes returned HTTP 200 with no error
text.** (Ran via a Python script hitting every route for both tenants —
see conversation for full raw output.)

### Content correctness spot-checks (not just "does it load")

- **Books**: Tenant A shows exactly 2 active books (excludes the
  deliberately-deactivated "Riyadh as-Salihin" from earlier admin
  testing) with "Coming soon" placeholders; Tenant B shows all 3
  (never deactivated for that tenant).
- **Q&A**: category tabs render and correctly filter; all 15 seeded
  Roman-Urdu questions present.
- **About**: Tenant A shows "**Walkthrough Edited About Title**" (an
  admin edit from Batch 2's walkthrough); Tenant B shows the original
  "Islamic Coaching Institute" — confirmed via direct grep on server-
  rendered HTML, not just screenshot inspection.
- **Contact**: Tenant A shows "**+966-WALKTHROUGH-TEST**" (an admin
  edit); Tenant B shows the original `+92 300 123 4567` — zero bleed.
- **Home Hero**: Tenant A's Bismillah banner shows "**Walkthrough
  Edited Home Subtitle**"; Tenant B shows the original "Learn Islam —
  Anywhere, Anytime" tagline fallback.
- **Islamic Tools re-theming verified programmatically**: grepped all 4
  tools pages' rendered HTML for the old hardcoded classes
  (`bg-sky-600`, `bg-slate-50 p-6`, `min-h-screen bg-slate`) — zero
  matches on any of them, confirming the re-polish fully replaced the
  old styling. Also confirmed all 4 now render the tenant's own header
  (e.g. "Masjid An-Noor") — proving they're inside the shared layout,
  not a bypassed standalone page.
- **Dhikr Counter data integrity**: confirmed via API and a (slower,
  `networkidle`-waited) screenshot retake that all 8 of Tenant A's dhikr
  items (6 defaults + 2 from earlier admin testing) render correctly —
  an earlier screenshot in this same session briefly showed "No dhikr
  items" due to a Playwright test-script timing race (insufficient wait
  before the client-side fetch resolved), not an actual app defect;
  flagging this explicitly rather than silently omitting it, since the
  instructions asked for an honest pass/fail account.

**No dead links or leftover stub/placeholder text found** anywhere in
this pass — every screen either shows real per-tenant data or a clear,
intentional empty/coming-soon state (never a hardcoded "Lorem ipsum" or
"TODO"-style stub).

## Final checks

```
$ npx eslint src/ --ext .ts,.tsx
✖ 3 problems (0 errors, 3 warnings)   ← same pre-existing benign warnings
ESLINT EXIT CODE: 0

$ npm run build
✓ Compiled successfully
✓ Generating static pages (25/25)
BUILD EXIT CODE: 0
```

`/t/[slug]/books` now appears as a real compiled route (didn't exist
before this batch); all other Batch 3 routes compiled cleanly as
dynamic server-rendered pages.

## Scope boundary respected

PWA manifest/service-worker generation was **not** started — reserved
for the next phase, as instructed.

## 100% Public App — screen inventory

Every screen originally present (in structure or intent) in the
attached `index.html` now exists as a real, dynamic, tenant-isolated,
themed Next.js route: Home, Quran (both editions + PDF viewer), Qaida
(+ viewer), Allah's/Prophet's Names, Daily Duas (menu + Masnoon list +
5 modals), 40 Hadith, Pillars (now genuinely functional, unlike the
original), Prayers (Wudu/Namaz/Other bottom sheets), Islamic Books,
Q&A, About, Contact — plus 4 entirely new Islamic Tools screens that
didn't exist in the original app at all (Sehri/Iftar, Dhikr Counter,
Hijri Calendar, Zakat Calculator).
