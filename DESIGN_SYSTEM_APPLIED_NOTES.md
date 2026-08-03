# Design System & UI Polish — Step 2 Delivery Notes

## Scope completed

Applied the approved Design System proposal (`/home/user/design-proposal/design-system.html`)
across the entire application: Super Admin Panel, Institute Admin Panel, and every Public
App screen. This was a refactor of existing screens onto shared tokens/components — no
functional/behavioral changes, no new features.

## What changed

### 1. Shared token system (`src/app/globals.css`)
- Full neutral scaffold (surfaces/borders/3-tier text/semantic colors), identical for every
  tenant and for both admin panels.
- Type scale (`--fs-display` … `--fs-micro`), with a **separate, more generous Arabic/Urdu
  scale** (`--fs-ar-display`, `--fs-ar-body`, `--lh-arabic: 2.1`, `--lh-urdu: 2.0`) applied
  everywhere Arabic/Urdu text appears (Duas, Pillars, Names, Hadith, Qaida para names,
  Prayers/Wudu Arabic phrases, Theme Customizer live preview).
- 4px-based spacing scale, 4-step radius scale, 4-step soft/neutral shadow scale.
- `--tenant-primary` / `--tenant-secondary` / **`--tenant-on-primary`** (new — see bug fix
  below) layered on top of the neutral scaffold, never mixed into it.
- `html.dark` re-maps the same semantic roles (not a naive invert) — applied **only** via an
  explicit class toggle driven by `tenant_branding.dark_mode_default`, never from
  `prefers-color-scheme`.
- Global `prefers-reduced-motion: reduce` media query collapses all transitions/animations.
- Visible `:focus-visible` ring (3px, tenant-primary-tinted) on every interactive element,
  everywhere — no `outline: none` without a replacement anywhere in the codebase.
- Signature motif (`.ds-motif-bg`, subtle geometric khatam-star pattern) — used only on hero
  banners/empty-states/login screens, per the approved proposal; unchanged from what was
  shown in Step 1.

### 2. Reusable component library (`src/components/ui/`)
New: `Button`, `Field`/`Input`/`Textarea`/`Select`, `Card`, `Badge`, `Tabs`, `EmptyState`,
`Skeleton`/`SkeletonCardGrid`/`SkeletonList`, `Modal` — barrel-exported from
`src/components/ui/index.ts`. Existing shared components (`ConfirmDeleteButton`,
`TenantNav`, `ThemeStyleTag`, `PageEditor`) were rewritten to consume the same tokens.

### 3. Bug found and fixed: hardcoded white button text
**Discovery:** the live Theme Customizer always rendered primary/secondary button text as
white. For light-primary-color presets (the two new dark presets, Midnight Dome and Crimson
Night), this fails WCAG contrast outright — 2.14:1 and 2.77:1 respectively, well under the
3:1 minimum even for large text. This was a real, working bug in the delivered code before
this pass, not a hypothetical.

**Fix:** added `src/lib/color-contrast.ts` (`getOnColorText`), which computes relative
luminance from the actual hex color and picks black or white text — the same WCAG formula
used to compute every contrast ratio in the Step 1 proposal. `ThemeStyleTag.tsx` now sets
`--tenant-on-primary` from this function instead of hardcoding white, for **every** tenant,
not just the two new dark presets — so a tenant who picks any custom light color for primary
also gets correct button text automatically. Verified: Midnight Dome now computes navy text
at 8.74:1, Crimson Night computes near-black text at 6.94:1.

### 4. Redesigned 8 preset themes
Replaced the old catalog (`Sky Blue / Emerald / Royal Purple / Amber Gold / Rose / Midnight /
Teal / Crimson Night`, several of which paired a color with a lighter/darker version of
itself) with: **Noor Blue, Zaytun Green, Amethyst, Saffron Dawn, Rose Dusk, Midnight Dome,
Teal Oasis, Crimson Night** — each pairing primary + accent from genuinely different hue
families, every pairing checked against WCAG contrast (documented in the Step 1 proposal).
`preset_theme_key` values changed (e.g. `sky_blue` → `noor_blue`); this is a frontend-only
catalog (per migration 020's original design decision), so no migration was needed, but any
tenant that had already selected an old preset key will show no highlighted preset until
they pick a new one — their actual color values are untouched, only the "which preset is
currently selected" highlight is affected. Flagging this as a minor, cosmetic-only side
effect of the intentional preset redesign.

### 5. Screens refactored
**Public App (13 screens/route groups):** Home, Pillars, Duas (menu + category + modals),
Hadith, Names, Prayers (+ 3 modals), Quran (list + viewer, both editions), Qaida (list +
viewer), Books, Q&A, About, Contact, all 4 Tools screens (Sehri/Iftar, Dhikr, Calendar,
Zakat) — plus the shared `(public)/layout.tsx` header and `TenantNav`.

**Institute Admin Panel:** sidebar/layout, dashboard, Theme Customizer (full rebuild),
Location & Zakat Settings, PageEditor (About/Home Hero), and all 13 content CRUD screens
(Quran, Qaida, Names, Duas, Hadith, Pillars, Prayers, Dhikr, Calendar, Books, Q&A, Contact,
Home Menu Config) — via a scripted regex pass for the repetitive CRUD boilerplate (buttons,
inputs, cards, muted/error text) followed by manual cleanup of every remaining raw Tailwind
class; confirmed zero `bg-white`/`bg-slate-*`/`text-slate-*` classes remain anywhere under
the admin tree.

**Super Admin Panel:** platform-admin login (motif-treated), tenant-admin login, dashboard
(tenant table + pending-deletion table + delete-confirmation modal), Create New Tenant form,
View-as-Tenant (impersonation) screen.

### 6. Light-mode-by-default confirmation
Per your two approved decisions:
- Both admin panels are **never** theme-aware — they always render in a fixed light palette,
  confirmed by grep showing zero `dark`/`classList` references anywhere under
  `src/app/t/[slug]/admin/**`.
- The public app applies dark mode **only** from `tenant_branding.dark_mode_default`, set
  explicitly per-tenant, never inferred from OS/browser preference. Verified live: both test
  tenants currently have `dark_mode_default = false` (confirmed via direct DB query); when
  Tenant A's flag was set to `true` as a test, the served HTML correctly emitted
  `classList.add('dark')`, and reverting to `false` correctly emitted `classList.remove('dark')`
  — proving an explicit tenant choice is respected in both directions, with no code path that
  silently forces a tenant into dark or light against their own setting.

## Proof

### Before/after screenshots (`screenshots/redesign/`)
- `before_a_home.png` / `after_a_home.png`, `before_b_home.png` / `after_b_home.png`
- `before_theme_customizer.png` / `admin_check_theme.png`
- `before_a_hadith.png` / `after_a_hadith.png`, `before_b_hadith.png` / `after_b_hadith.png`
- `before_a_pillars.png` / `after_a_pillars.png`, `before_b_pillars.png` / `after_b_pillars.png`
  (the clearest before/after for the Arabic-typography fix — Shahada's Bismillah-style Arabic
  text visibly gains proper size and line-height)
- `before_a_duas.png` / `after_a_duas.png`, `before_b_duas.png` / `after_b_duas.png`
- Additional admin screens: `admin_check_dashboard.png`, `admin_check_names.png`,
  `admin_check_duas.png`, `admin_check_books.png`, `admin_check_qa.png`,
  `admin_check_dhikr.png`, `admin_check_calendar.png`, `admin_check_contact.png`,
  `admin_check_home-menu.png`, `admin_check_qaida.png`, `admin_check_quran.png`,
  `admin_check_prayers.png`, `admin_check_pages_about.png`
- Super Admin: `sa_login.png`, `sa_dashboard.png`, `sa_new_tenant.png`

### Tenant isolation re-proven after the redesign
- DB query: Tenant A (`Masjid An-Noor`, `#7C3AED`, Poppins) vs Tenant B (`Darul Uloom
  Academy`, `#059669`, Nunito) — distinct branding rows, unaffected by the shared CSS/
  component refactor.
- DB query: Tenant A's `pillars.description` for Shahada still reads "Walkthrough edited:
  The declaration of faith."; Tenant B's is the original, unedited seed text — confirmed
  both in the database and visually in the `after_a_pillars.png` / `after_b_pillars.png`
  screenshots.
- Screenshots confirm Tenant A shows 2 active books (Riyadh as-Salihin deactivated) vs Tenant
  B's 3 — unaffected by the visual refactor.

### Full 40-route walkthrough (20 routes × 2 tenants)
Re-ran via direct HTTP requests against every public route for both tenants post-redesign:
**40/40 PASS** (HTTP 200, no error text in response body). Full raw pass/fail table
generated by the walkthrough script is reproducible; every route listed as PASS.

### Build & lint
- `npx eslint src/ --ext .ts,.tsx` → **exit code 0**, 0 errors (only the 3 pre-existing,
  unrelated `<img>`-vs-`next/image` warnings on the Theme Customizer's logo/favicon previews,
  unchanged from before this phase).
- `npm run build` → **exit code 0**, compiled successfully, all 25 static pages generated,
  all dynamic tenant-dependent routes correctly marked `ƒ` (server-rendered on demand).

## Known cosmetic side-effect (flagged, not a regression)
Any tenant that had previously selected one of the 8 old preset keys (`sky_blue`, `emerald`,
`royal_purple`, `amber_gold`, `rose`, `midnight`, `teal`, `crimson_night`) will no longer see
a preset highlighted as "currently active" in the Theme Customizer grid, since those keys no
longer exist in the new catalog. Their actual saved colors are completely untouched — this
only affects which swatch (if any) shows the "selected" border. Neither test tenant in this
session was in that state (Tenant A/B's colors were set directly via SQL for this walkthrough,
not via a preset click), so this was not observable in the proof above, but is worth knowing
if any earlier-session tenant data is later restored.

## Sandbox environment note
The sandbox reset again at the start of this phase (Docker/Postgres/node_modules/Playwright
wiped, as has happened before — all source under `/home/user` persisted). Rebuilt per the
documented procedure; recreated Tenant A/B/platform-admin with the same edit fingerprints
used in every prior phase (Ar-Rahman meaning edit, Kalima translation edit, Shahada
description edit, Fajr rakat_sunnah=3, Riyadh as-Salihin deactivated) so the before/after
comparison and isolation proof remain meaningful. New IDs this session: Tenant A
`2577f4e2-6bde-4dbc-b968-2d8fa2dbff12`, Tenant B `04311ba3-0f09-48a6-93ee-59fd3dd2257f`.
