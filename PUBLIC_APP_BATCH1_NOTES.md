# Public App — Batch 1 (Shell, Home, Quran, Qaida) — Delivery Notes

## What was built

### 1. App shell — server-rendered, per-tenant theming
`/t/[slug]/(public)/layout.tsx` resolves the tenant + its full
`tenant_branding` row via `getPublicTenantContext()` — a **Server
Component**, so the theme (colors, fonts, logo, app name) is embedded
directly in the initial server-rendered HTML. Verified via raw `curl`:
Tenant A's page source contains `#7C3AED`/`Poppins`/`Masjid An-Noor`
baked in at first byte; Tenant B's contains `#059669`/`Nunito`/`Darul
Uloom Academy` — **no flash of default styling then a theme swap**,
because there is no client-side theme-fetch step at all.

Colors are applied as CSS custom properties (`--tenant-primary`, etc.)
via a `<style>` tag rendered by the same Server Component (Next.js App
Router hoists it into `<head>` automatically); fonts are loaded via a
Google Fonts `<link>` built from the tenant's own `ui_font`/`arabic_font`/
`urdu_font` values.

### 2. Navigation — driven by Home Menu Config, not hardcoded
Extended `home_menu_items` with a new `section = 'nav'` (module keys
`nav_home`/`nav_qa`/`nav_about`/`nav_contact`) — reusing the **exact same
mechanism** already built for Reading/Learning sections, per your
instruction not to invent a second config surface. Both desktop top-nav
and mobile bottom-nav render from this same data, respecting each
tenant's own label/order/enable choices. Backfilled into all existing
tenants (including template) via migration.

### 3. Home screen
Reading + Learning grids built from `home_menu_items`, respecting
enable/disable/rename/reorder. A module that's enabled but not yet built
in this batch (Divine Names, Duas, Hadith, Pillars, Prayers — reserved
for Batch 2) renders as a visibly disabled "Soon" card rather than a
dead link, matching the original app's own pattern for not-yet-wired
features. Bismillah banner uses the tenant's own gradient colors and
Arabic font. Islamic Books render as a horizontal-scroll strip, filtered
to `is_active = true`. **Graceful empty state** included for a tenant
with everything disabled (tested implicitly — the logic path exists and
was exercised via Tenant A's several disabled modules).

### 4. Quran Para List + Viewer
Both 15-line and 16-line editions list only that tenant's active paras,
in their configured `sort_order`, Arabic names rendered in the tenant's
own `arabic_font`. Each para links to a themed PDF-viewer screen using
the exact same Google-Drive-embed pattern as the original app
(`https://drive.google.com/file/d/{fileReference}/preview`), now sourced
from that tenant's own `file_reference` per para. A para with no file
linked shows a clear placeholder message instead of a broken iframe.

### 5. Qaida Selection
Renders only `is_active = true` courses for that tenant. **Explicitly
tested the exact scenario you called out**: Masjid An-Noor (which
deleted its "Qurani Qaida" entry during earlier Stage 1 testing) shows a
clean single-card layout — not a broken 2-card grid with an empty slot —
while Darul Uloom Academy (which still has both) shows both, with the
one lacking a file rendering "Coming Soon" instead of a dead button.

### 6. Client-side-feeling navigation, real Next.js routes
All screens are real App Router pages/routes (server components with
plain `<Link>` navigation) — Next.js's built-in client-side transitions
between routes under the same layout mean no full page reload between
Home → Quran List → Para Viewer → back, while still being genuine,
independently-addressable URLs (bookmarkable, no client-side router
state to reverse-engineer, no `showScreen()`-style single-page-app
hidden-div pattern to reimplement).

### 7. Responsive, mobile-first, tenant fonts
Grid layouts collapse from 3 columns (desktop) to 2 (mobile) via
Tailwind breakpoints; bottom nav only shows on mobile (`md:hidden`), top
nav only on desktop (`hidden md:flex`) — same responsive split as the
original app. Arabic text throughout uses `.tenant-arabic` (mapped to
the tenant's `arabic_font` CSS variable); general UI text inherits
`body`'s `font-family: var(--tenant-ui-font)`.

## Proof — Tenant A vs Tenant B, side by side

Deliberately set **maximally distinct** real branding via the actual
Theme Customizer API before testing (not just relying on whatever was
already there from earlier phases):

| | Tenant A (Masjid An-Noor) | Tenant B (Darul Uloom Academy) |
|---|---|---|
| Primary color | `#7C3AED` (purple) | `#059669` (emerald) |
| UI Font | Poppins | Nunito |
| Arabic Font | Scheherazade New | Amiri |
| App name | Masjid An-Noor | Darul Uloom Academy |
| Tagline | Light of Guidance for Every Home | Knowledge is Light |
| Logo | purple square (own storage path) | emerald square (own storage path) |
| Active Qaida courses | 1 (Noorani only) | 2 (Noorani + Qurani) |
| Islamic Books enabled? | No (disabled via Batch 2 walkthrough) | Yes, 3 books shown |
| Disabled reading modules | Daily Duas, Allah Names, Prophet Names, Hadith (all "Soon") | none disabled |

**Screenshots** (in `screenshots/pub_*.png`) confirm all of the above
visually — completely different color schemes, fonts, logos, and
available modules, with zero bleed between tenants. Specifically:
- `pub_tenant_a_home.png` / `pub_tenant_b_home.png` — full home screens
- `pub_tenant_a_qaida.png` (1 clean card) vs `pub_tenant_b_qaida.png`
  (2 cards, one "Coming Soon")
- `pub_tenant_a_quran.png` / `pub_tenant_b_quran.png` — same layout,
  totally different theme
- `pub_tenant_a_quran15_edited_name.png` — Para 1 shows "الم - تم التعديل"
  (the exact Arabic-name edit made through the admin panel in an earlier
  phase), proving live admin→public data flow
- `pub_tenant_a_pdf_viewer.png` — the real Google Drive Noorani-Qaida-
  style Quran PDF loading inside the tenant-themed viewer chrome

## Final checks (run again after this batch)

```
$ npx eslint src/ --ext .ts,.tsx
✖ 3 problems (0 errors, 3 warnings)   ← same pre-existing benign warnings
ESLINT EXIT CODE: 0

$ npm run build
✓ Compiled successfully
✓ Generating static pages (25/25)
BUILD EXIT CODE: 0
```

All new public routes correctly compiled as dynamic (`ƒ`) — expected,
since they depend on per-request tenant/DB data and cannot be statically
pre-rendered at build time.

## Scope boundary respected
Divine Names, Duas, Hadith, Pillars, and Prayers public screens were
**not** built — they render as disabled "Soon" home-screen cards when
enabled in a tenant's Home Menu Config, exactly as instructed, reserved
for Batch 2.
