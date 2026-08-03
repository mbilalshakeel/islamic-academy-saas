# ICI Multi-Tenant Web Platform — Project Status
**Date**: 2026-08-01 (Asia/Riyadh / Dammam context)  
**Repository**: `/home/user/ici-app-next`

---

## 1. Full Summary of Completed Phases

### Phase 1: Database Schema & Authentication
- **Multi-Tenant Postgres Schema (`/home/user/ici-app`)**: Fully implemented with Row-Level Security (RLS) policies on all tables (`tenants`, `tenant_branding`, `site_pages`, `home_menu_items`, `quran_editions`, `quran_pages`, `qaida_lessons`, `divine_names`, `duas`, `hadiths`, `pillars`, `prayers`, `books`, `qa_items`, `zakat_settings`, etc.).
- **GoTrue Auth Integration**: Users table linked with Supabase Auth, JWT claims supporting tenant-scoped anonymous client (`createSupabaseScopedAnonClient`), tenant admin client (`requireTenantAdmin`), and platform super admin client (`requirePlatformAdmin`).
- **Template Tenant & Seeding**: `seed_tenant_defaults(uuid)` RPC seeds standard default content for any newly created tenant.

### Phase 2: Super Admin Panel (`/platform-admin/**`)
- Built login, dashboard, and management screens for platform operators.
- Features: Create new tenant, Suspend tenant, Reactivate tenant, Request Deletion / Hard Delete, Restore tenant, and View-as-Tenant impersonation.

### Phase 3: Institute Admin Panel (`/t/[slug]/admin/**`)
- Built institute admin login and complete administration suite for tenant administrators.
- Features:
  - **Theme Customizer**: Edit app name, short name, tagline, description, custom primary/secondary/background/text colors, preset themes, fonts, logo & favicon uploads (with automatic PWA icon generation).
  - **Content CRUD**: Full create/read/update/delete management across all educational domain tables.
  - **Home Menu Config**: Enable/disable and reorder modules on the public home screen.
  - **PageEditor**: Structured block-level editor for "About" and "Home Hero" screens.
  - **Location & Zakat Settings**: Configurable location/method for Sehri/Iftar timings and Nisab/zakat parameters.

### Phase 4: Public App (`/t/[slug]/(public)/**`)
- Fully implemented anonymous public educational web app with tenant-scoped RLS data isolation.
- Complete 40-route navigation including:
  - **Home**: Bismillah hero banner, dynamic enabled reading/learning module cards, horizontal book carousel.
  - **Quran Viewers**: 16-Line and 15-Line Quran list and page viewers.
  - **Qaida**: Arabic alphabet and qaida lesson reader.
  - **Allah & Prophet Names**: 99 Names of Allah and 97 Names of the Prophet with meanings/transliterations.
  - **Duas & Hadith**: Daily Duas list with modal category filters, 40 Hadiths viewer.
  - **Pillars & Prayers**: Pillars of Islam explanations, daily prayer timings & rakat breakdown table.
  - **Books & Q&A**: Islamic books library, frequently asked questions viewer.
  - **About & Contact**: Institute info page and contact details.
  - **Interactive Tools**: Sehri & Iftar Ramadan timing table, Dhikr Counter, Hijri Calendar, and Zakat Calculator.

### Phase 5: Design System Application (Approved)
- **Shared Tokens (`src/app/globals.css`)**: Standardized `--tenant-primary`, `--tenant-secondary`, spacing, typography, shadow, and surface tokens across the platform.
- **UI Component Library (`src/components/ui/`)**: Refactored shared components (`Button`, `Field`, `Input`, `Select`, `Card`, `Badge`, `Tabs`, `Modal`, `EmptyState`, `Skeleton`).
- **WCAG Contrast & Theme Catalog**: Implemented `getOnColorText()` dynamic contrast calculation; redesigned 8 preset themes (Noor Blue, Zaytun Green, Amethyst, Saffron Dawn, Rose Dusk, Midnight Dome, Teal Oasis, Crimson Night) with verified WCAG accessibility.
- **Typography & Motif**: Proper line-heights for Arabic (`Amiri`, `Scheherazade New`) and Urdu (`Noto Nastaliq Urdu`, `Gulzar`); signature Bismillah geometric motif applied cleanly without cluttering reading surfaces.
- **Default Theme Mode**: Set platform default to Light Mode across all public routes, with optional toggle for `dark_mode_default` per tenant.

---

## 2. Current State of PWA Phase (Progressive Web App per Tenant)

### What Was Started & What Is Working (Proven)
1. **Dynamic Manifest per Tenant (`/t/[slug]/manifest.json`)**:
   - Implemented route handler at `src/app/t/[slug]/manifest.json/route.ts`.
   - Fetches tenant identity and `tenant_branding` via `getPublicTenantContext(slug)`.
   - Returns valid web app manifest JSON with tenant-specific `name`, `short_name`, `theme_color`, `background_color`, `start_url` (`/t/[slug]/`), and `scope` (`/t/[slug]/`).
   - Queries `tenant_pwa_icons` ordered by size and sets `purpose: "any maskable"` on 192x192 and 512x512 icons for Lighthouse PWA installability compliance.
   - **Proven Side-by-Side**: Verified via `curl` and `jq` that Tenant A (`masjid-noor`, `#7C3AED`) and Tenant B (`darul-uloom`, `#059669`) return completely independent, isolated manifests.
2. **Server-Side PWA Icon Generation (`src/lib/pwa-icons.ts`)**:
   - Built image processing helper using `sharp` to generate all 8 required icon sizes (`72, 96, 128, 144, 152, 192, 384, 512`) from uploaded logos or fallback initials SVG.
   - Integrated automatic generation into `src/app/api/tenant-admin/branding/upload/route.ts` when `kind === "logo"`.
   - Created on-demand generation endpoint `src/app/api/tenant-admin/branding/generate-icons/route.ts` and added "Generate PWA Icons" button + status UI to Theme Customizer (`src/app/t/[slug]/admin/settings/theme/page.tsx`).
   - **Proven in DB & Storage**: Generated and verified 16 rows in `tenant_pwa_icons` (8 sizes for Tenant A, 8 sizes for Tenant B), confirmed HTTP 200 OK and `image/png` headers on public Supabase storage URLs.
3. **Dynamic Per-Tenant Service Worker (`/t/[slug]/sw.js`) & Registration**:
   - Implemented route handler at `src/app/t/[slug]/sw.js/route.ts` returning JS with `Service-Worker-Allowed: /t/[slug]` header.
   - Includes `sw_cache_version` in cache names (`ici-[slug]-v[version]`), ensuring old caches are purged on activation while other tenants' caches are untouched.
   - Uses **Network-First** strategy for navigation/HTML content (so admin edits appear instantly on next load without stale cache issues) and static asset caching for offline fallback.
   - Created client-side registrar (`src/components/PwaRegistrar.tsx`) and added `<link rel="manifest">`, `<meta name="theme-color">`, Apple PWA tags, and `<PwaRegistrar slug={tenant.slug} />` to `src/app/t/[slug]/(public)/layout.tsx`.

### What Is Incomplete / Very Next Step for Fresh Session
- **Next Step 1**: Execute the automated Playwright proof script (`node prove_sw_and_cache_refresh.mjs`) against `http://127.0.0.1:3000` to capture screenshots in `screenshots/pwa/` (`tenant_a_sw_ready.png`, `tenant_b_sw_ready.png`, `tenant_a_cache_refreshed.png`) and confirm SW activation + cache refresh after a Tenant A admin content edit.
- **Next Step 2**: Run Lighthouse PWA audit CLI against locally served pages (`http://127.0.0.1:3000/t/masjid-noor`) using `--only-audits=installable-manifest,service-worker,apple-touch-icon,maskable-icon,viewport,splash-screen,themed-omnibox` and record the installability audit results.
- **Next Step 3**: Run the final 40-route walkthrough script, `npm run build`, and `npx eslint src/ --ext .ts,.tsx`, then report the final plain-English capability summary.

---

## 3. Environment Setup Notes

### Required Environment Variables (`.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
NEXT_PUBLIC_APP_BASE_DOMAIN=iciapp.com
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
CRON_SECRET=local-dev-cron-secret-change-in-prod
SUPABASE_JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long
```

### Running Local Supabase Stack & Migrations
1. Ensure Docker daemon is running:
   ```bash
   sudo dockerd > /tmp/dockerd.log 2>&1 &
   sudo chmod 666 /var/run/docker.sock
   ```
2. Start local Supabase containers (applies all Postgres SQL migrations automatically):
   ```bash
   cd /home/user/ici-app && /tmp/supabase start --workdir /home/user/ici-app
   ```
3. Start Next.js dev server:
   ```bash
   cd /home/user/ici-app-next
   nohup npm run dev -- -p 3000 </dev/null >/tmp/nextdev.log 2>&1 &
   disown -a
   ```

### Test Tenant Credentials & UUIDs
- **Tenant A (`Masjid An-Noor`)**:
  - Slug: `masjid-noor`
  - Tenant ID: `7fe561ed-c2dc-4424-ab44-c6f8a4f58c67`
  - Admin Login: `admin@masjid-noor.test` / `TestPass123!`
  - Auth User ID: `decb5d9d-f842-4046-b8b2-374abd633513`
- **Tenant B (`Darul Uloom Academy`)**:
  - Slug: `darul-uloom`
  - Tenant ID: `a5ad4866-30d4-4b84-9d86-78f839991796`
  - Admin Login: `admin@darul-uloom.test` / `TestPass123!`
  - Auth User ID: `83c8bc0b-d069-4bf0-a20e-06a313f706a6`
- **Platform Super Admin**:
  - Login: `superadmin@ici-platform.test` / `SuperSecret123!`
  - ID: `07a2d6b6-4a8b-499a-bb51-af34dabecd47`
- **Template Tenant**:
  - ID: `00000000-0000-0000-0000-000000000001`
  - Slug: `template` (`is_template=true`)
