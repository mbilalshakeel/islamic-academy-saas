# Institute Admin Panel — COMPLETE (Final Consolidated Summary)

The entire Institute Admin Panel — Theme Customizer, Stage 1, Stage 2, and
Batch 2 — is now built and proven working end-to-end.

## What was built in this final batch

### Batch 2 screens (5 new admin areas)
1. **Islamic Books** — full CRUD (title, author, description, category,
   language tags, cover icon/gradient, file provider/reference, active
   toggle, drag-to-reorder), using the same generic resource-CRUD pattern
   as Stage 1.
2. **Q&A** — CRUD for question/answer pairs, category filter tabs
   (namaz/quran/roza/zakat/aqaid), active toggle, drag-to-reorder.
3. **Contact Channels** — CRUD for phone/whatsapp/email/address/social/
   working-hours entries, drag-to-reorder.
4. **Home Menu Config** — toggle each module on/off, rename its label
   inline, drag-to-reorder within Reading/Learning sections. The 4 Stage 2
   tools (Sehri/Iftar, Dhikr Counter, Hijri Calendar, Zakat Calculator) are
   now toggleable modules here too, backfilled into every existing tenant
   (including the template) via a migration, so nothing needed re-seeding.
5. **About Us & Home Hero** — **the one screen that genuinely didn't fit
   the generic CRUD pattern**, explained below.

### Why About/Home Hero needed its own small block editor
`site_pages.content_blocks` is a JSONB array inside **one row per page per
tenant** (enforced by `UNIQUE(tenant_id, page_key)`) — not a table of
independent rows an admin adds/removes/reorders via POST/PATCH/DELETE.
"Add/remove/reorder blocks" here means editing array positions client-side
and PUTting the whole array back in one request. Built a small, dedicated
`PageEditor` component (add/remove/move-up/move-down for paragraph and
list-type blocks; simple field editors for the few singleton block types
already present in seeded data — developer credit, footer note, copyright,
version — so existing content is never silently dropped). Tenant isolation
is identical to every other screen: the underlying `PUT
/api/tenant-admin/pages/[pageKey]` route is still the same anon-key,
RLS-bound client, explicit field whitelist, no client-supplied tenant_id.

## Final walkthrough — every single admin screen, one real change each

As **Masjid An-Noor's real admin** (logged in via the actual app), made one
concrete change through the real API (same calls the UI makes) in **all 17
admin areas**:

| # | Screen | Change made | Confirmed via GET |
|---|---|---|---|
| 1 | Theme Customizer | Tagline → "Final Walkthrough Test Tagline" | ✅ (cache_v bumped to 7) |
| 2 | Location & Zakat Settings | Currency → "SAR-FINAL-TEST" | ✅ |
| 3 | Quran | Para 1 Arabic name edited | ✅ |
| 4 | Qaida | Noorani Qaida level_label edited | ✅ |
| 5 | Divine Names | Ar-Rahman's meaning edited | ✅ |
| 6 | Duas | Kalima Tayyiba translation edited | ✅ |
| 7 | Hadith | Added hadith #42 | ✅ |
| 8 | Pillars | Shahada's description edited | ✅ |
| 9 | Prayers | Fajr's rakat_sunnah → 3 | ✅ |
| 10 | Dhikr Items | Added "Walkthrough Test Dhikr" | ✅ |
| 11 | Calendar Events | Added "Walkthrough Test Event" | ✅ |
| 12 | Books | Toggled a book to inactive | ✅ |
| 13 | Q&A | Edited an answer | ✅ |
| 14 | About Us Page | Hero title edited | ✅ |
| 15 | Home Hero | Hero subtitle edited | ✅ |
| 16 | Contact Channels | Phone value edited | ✅ |
| 17 | Home Menu Config | Renamed & disabled the Books module | ✅ |

### Tenant isolation — re-verified for all 17, after every single change
Immediately re-queried **Tenant B (Darul Uloom Academy)**, via its own
separate real session, for the exact same 17 items — **every single one
came back completely unchanged**: original tagline, original USD currency,
original Para 1 Arabic text, original qaida label, original Ar-Rahman
meaning, original Kalima translation, exactly 40 hadiths (no #42), original
Shahada description, Fajr rakat_sunnah still 2, exactly 6 dhikr items (no
walkthrough entry), exactly 13 calendar events (no walkthrough entry), all
books still active, original Q&A answer, original About/Home Hero titles,
original phone number, and the Books home-menu module still enabled with
its original label.

**Cross-checked directly in the database** as the final word:
```
 A tagline      | Final Walkthrough Test Tagline
 B tagline      | Guiding Hearts • Illuminating Minds
 A currency     | SAR-FINAL-TEST
 B currency     | USD
 A hadith count | 42
 B hadith count | 40
```

Screenshots of the live UI (`screenshots/final_dashboard.png`,
`final_home_menu.png`) confirm the full admin panel renders correctly —
17 organized cards across Settings, Religious Content, Islamic Tools, and
Site Content groups, plus a working, grouped sidebar nav.

## Final build & lint checks (run exactly as requested)

```
$ npx eslint src/ --ext .ts,.tsx
✖ 3 problems (0 errors, 3 warnings)     ← warnings are pre-existing,
                                            benign <img> vs next/image
                                            suggestions on the Theme
                                            Customizer's logo/favicon
                                            previews (dynamic user-
                                            uploaded URLs)
ESLINT EXIT CODE: 0

$ npm run build
✓ Compiled successfully
✓ Generating static pages (25/25)
BUILD EXIT CODE: 0
```

Both clean. Every admin route (17 content/settings screens + platform-admin
+ public tool pages) compiled and is present in the production build output.

## What the complete Institute Admin Panel now covers

- **Theme Customizer**: presets, custom colors with live preview, fonts,
  logo/favicon upload, dark mode default
- **Location & Zakat Settings**: city/country, calculation method, currency,
  gold/silver prices
- **7 Religious Content areas**: Quran, Qaida, Divine Names, Duas, Hadith,
  Pillars, Prayers — full CRUD with reorder
- **2 Islamic Tools content areas**: Dhikr Items, Calendar Events
- **5 Site Content areas**: Books, Q&A, About Us, Home Hero, Contact Channels
- **Home Menu Config**: toggle/rename/reorder every dashboard module,
  including all 4 Stage 2 public tools

All of it built on one consistent, proven pattern: anon-key/RLS-bound
Supabase client everywhere (never `service_role` outside
`/api/platform-admin/**`, enforced by the ESLint rule), explicit
field whitelists on every write, `stamp_tenant_id()` + RLS as the real
tenant-isolation boundary, and `sw_cache_version` bumped on every content
change.

## Not started (per your instruction)
The Public App (student/visitor-facing screens) — reserved for the next
phase.
