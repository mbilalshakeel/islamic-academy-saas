# Public App — Batch 2 (Names, Duas, Hadith, Pillars, Prayers) — Delivery Notes

## What was built

All 5 screens follow the same pattern established in Batch 1
(`getPublicTenantContext()` server-side resolution, scoped-anon reads,
tenant CSS variables/fonts already applied by the shared `(public)`
layout), plus small client components only where genuine interactivity
was needed (modals, tabs).

1. **Allah's & Prophet's 99 Names** (`/t/[slug]/names/[category]`) — grid
   from `divine_names`, filtered by `category` + tenant, ordered by
   `order_index`, showing arabic/transliteration/meaning_en/meaning_urdu.
2. **Daily Duas** (`/t/[slug]/duas`) — menu built from `dua_categories`,
   correctly branching on `display_type`: `list_screen` categories
   (Masnoon) link to `/t/[slug]/duas/[categorySlug]`; `modal` categories
   (Kalimas, Ayat-ul-Kursi, Dua-e-Qunoot, Iman-e-Mujmal/Mufassal) open an
   in-page modal — matching the original UX exactly, including numbered
   badges for Kalimas.
3. **40 Hadith** (`/t/[slug]/hadith`) — list from `hadiths` via
   `hadith_collections`, tenant-scoped, `sort_order`, showing
   number/text/narrator.
4. **Pillars of Islam** (`/t/[slug]/pillars`) — tabbed screen from
   `pillars` + `pillar_details` + `pillar_guide_steps`. **This was the
   screen flagged as structurally-present-but-functionally-incomplete in
   the original app** — see below for what that meant concretely and how
   it was fixed.
5. **Prayers** (`/t/[slug]/prayers`) — Wudu/Namaz/Other-Prayers bottom
   sheets from `prayers` + `ritual_guides` + `ritual_guide_steps`,
   matching the original's modal UX (tabbed Namaz sheet: Daily
   Prayers/Namaz Lesson/How to Perform).

## The Pillars screen — what "incomplete" meant and how it was fixed

Confirmed via the database (all rich content was already present —
`arabic_text`, `description`, `importance`, 3 `pillar_details`, and 3
`pillar_guide_steps` per pillar, for every tenant) that this was purely a
**front-end problem**: the original `index.html`'s pill-tab buttons and
`pillar-content-card` div existed, and a `pillarData` JS object with all
this content existed, but the actual DOM-rendering logic that should run
on tab click was never finished — clicking a different pillar pill never
changed what was displayed.

The rebuild (`PillarsClient.tsx`) makes tab-switching a real, working
`useState`-driven view: clicking a pillar tab re-renders arabic text,
title, description, the full bulleted detail list, an "importance" callout
box, and a numbered 3-step practical guide — all fields the schema always
had. Verified by screenshot: clicking from Shahada → Zakat shows
completely different, correct content for each.

## Rakat display — a deliberate fidelity note

`prayers.rakat_breakdown` (the ordered JSONB used by the *original*
seed data) does **not** get updated when an admin edits the summary
columns (`rakat_fard`/`rakat_sunnah`/etc.) via the Stage-1 CRUD screen —
confirmed directly: Tenant A's Fajr `rakat_breakdown` still literally says
`"2 Sunnah"` even though `rakat_sunnah = 3` after the walkthrough edit.
Rendering from the stale JSON would have silently hidden that admin edit
from the public app. `PrayersClient.tsx` instead formats the rakat
summary live from the four summary columns
(`formatRakatSummary()`) — the same columns the admin screen actually
writes — so an edit there is always immediately reflected publicly.

## Proof — Tenant A's 5 specific test edits, all confirmed live

| Area | Test edit (made in earlier phases) | Confirmed live in public app |
|---|---|---|
| Allah's Names | Ar-Rahman's meaning → "The Most Gracious (Walkthrough Edited)" | ✅ screenshot `b2_a_names.png` |
| Duas (Kalimas modal) | Kalima Tayyiba's translation → "Walkthrough Edited: There is no god but Allah." | ✅ screenshot `b2_a_kalimas_modal.png` |
| Hadith | Hadith #41 added + #42 added | ✅ screenshot `b2_a_hadith.png` — "42 Hadiths" total, both visible |
| Pillars | Shahada's description → "Walkthrough edited: The declaration of faith." | ✅ screenshot `b2_a_pillars_shahada.png` |
| Prayers | Fajr's `rakat_sunnah` → 3 | ✅ screenshot `b2_a_namaz_modal.png` — "3 Sunnah, 2 Fard" |

**Every one of Tenant B's corresponding screens re-confirmed showing
original, unedited content** in the same test pass (all screenshots
`b2_b_*.png`):
- Names: Ar-Rahman at #1 (never reordered) with unedited meaning "The
  Most Gracious"
- Hadith: exactly "40 Hadiths", no #41/#42
- Pillars: Shahada's original, unedited description
- Prayers: Fajr's original "2 Sunnah, 2 Fard"

Zero data bleed between tenants across all 5 areas, confirmed via actual
rendered HTML/screenshots, not just API responses.

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

All 6 new routes (`/duas`, `/duas/[categorySlug]`, `/hadith`,
`/names/[category]`, `/pillars`, `/prayers`) compiled correctly as
dynamic server-rendered pages.

## Scope boundary respected

Books, Q&A, About, Contact, and the Islamic Tools public pages were
**not** touched in this batch (Q&A/About/Contact already existed as
minimal stubs from Batch 1's nav wiring, left as-is) — reserved for
Batch 3.
