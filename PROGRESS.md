# PROGRESS.md — ICI Multi-Tenant Web Platform (PWA Phase)

> Resume point for a fresh session. Read this FIRST before touching code.
> Maintained after every meaningful chunk of work. Last updated: 2026-08-05.

---

## 1. Last Completed Step

### PRODUCTION DEPLOYMENT (Supabase) — SUPER ADMIN PANEL VERIFIED + TEST TENANT CREATED (2026-08-05)
- **Auth hook verified working:** login as `superadmin@ici-platform.test` → JWT claims
  decoded → `is_platform_admin: true`, `tenant_id: null` ✅.
- **Super Admin Panel verified end-to-end** against the production project:
  - `/platform-admin/login` + `/api/platform-admin/login` → `ok:true` (session cookie set).
  - `/platform-admin/dashboard` + `/api/platform-admin/tenants` → shows template tenant.
  - **Created real test tenant "Test Academy"** slug `test-academy`, plan `trial`,
    admin `testadmin@test-academy.com` → UUID **`a94ddfee-879c-4367-ab79-f0d1b79160b5`**.
  - Seeded content verified: **196 divine names, 40 hadiths, 45 duas, 2 quran editions,
    60 paras, 5 pillars, 5 prayers, 15 Q&A, 19 home menu items, 3 books, 13 calendar
    events, 10 contact channels, 6 dhikr items**. Admin user linked as `owner`.
- **Note:** tenant-creation invite email requires a valid email domain (`.test` TLD is
  rejected by GoTrue). Used `.com` in the test.

### PRODUCTION DEPLOYMENT (Supabase) — STARTED (2026-08-05)
- **Hosted Supabase project `ici-platform` connected** (ref `onybufoebaebfnwshagd`) via
  user's Management API Access Token (used inline, never stored/committed).
- **All 28 migrations applied in order** via Management API SQL endpoint.
  Verified: 29 public tables, RLS enabled on tenants/users/platform_admins, storage
  bucket `branding-assets` created, custom_access_token_hook function present.
- **Template tenant auto-seeded** (migration 014): ID
  `00000000-0000-0000-0000-000000000001`, "Islamic Coaching Institute (Template)",
  full content verified (2 Quran editions, 60 paras, 196 divine names, 40 hadiths).
- **Platform super admin created**: `superadmin@ici-platform.test` (auth user + row in
  `platform_admins` as `super_admin`).
- **OPEN ITEM (required):** the custom_access_token_hook is NOT enabled in GoTrue on
  the hosted project. The function exists but GoTrue isn't calling it (verified: login
  JWT lacks `is_platform_admin`/`tenant_id` claims). Must be enabled in the Supabase
  Dashboard: Auth → Hooks → "Customize Access Token (JWT) Claims" → Enable → URI
  `pg-functions://postgres/public/custom_access_token_hook`. Without this, tenant-admin
  and platform-admin logins get no RBAC claims and the panels won't work.

### PART 2 (WEB SAAS PLATFORM) — 100% DONE ✅ (2026-08-05)
- **`apple-touch-icon` fix applied + verified** in
  `src/app/t/[slug]/(public)/layout.tsx` — per-tenant 192px PWA icon is now
  served as `<link rel="apple-touch-icon">`. Confirmed in served HTML for both
  tenants (each points to its own icon-192.png). Build + eslint clean.
- Added **`.env.example`** with every required env var + production notes.

### PWA PHASE VERIFICATION — COMPLETE ✅ (2026-08-05)
Full end-to-end PWA proof ran and **PASSED** against a Docker-based local Supabase
stack + local Next.js production server. All sub-steps proven with real output:

- **Docker + Supabase local stack set up** (Docker 26.1.5, Supabase CLI 1.210.0).
  `supabase start` succeeded: API :54321, DB :54322, all containers healthy.
  All 28 migrations applied automatically.
- **Test tenants restored** with previous-session fingerprints:
  - Tenant A `masjid-noor` (Masjid An-Noor), primary `#7C3AED` (amethyst)
  - Tenant B `darul-uloom` (Darul Uloom Academy), primary `#059669` (teal)
  - Full default content via `seed_tenant_defaults()`, 8 PWA icons each,
    admin auth users linked to `public.users` (custom_access_token_hook injects
    `tenant_id` + `tenant_role` claims into JWTs — verified).
- **Manifest per tenant** — side-by-side differ completely (name, short_name,
  theme/background colors, start_url, scope). Each has 8 icons; 192/512 are
  `any maskable`. Icon URLs serve `200 image/png`.
- **Service worker per tenant** — registers under each tenant scope:
  `scope=/t/masjid-noor`, `scriptURL=/t/masjid-noor/sw.js`, cache `ici-masjid-noor-v2`;
  `scope=/t/darul-uloom`, cache `ici-darul-uloom-v1`.
- **Cache refresh** — Tenant A admin edited `home_hero` subtitle → `sw_cache_version`
  bumped (v2→v3) → cache name changed → public page showed the new subtitle on next
  load (network-first). Tenant B stayed isolated (cache `ici-darul-uloom-v1`,
  no Tenant A subtitle). `prove_sw_and_cache_refresh.mjs` → "All ... PASSED".
- **Lighthouse** — ⚠️ SEE section 2: Lighthouse 12.8 has NO PWA category. Audits
  `installable-manifest/service-worker/apple-touch-icon/maskable-icon/splash-screen/
  themed-omnibox` no longer exist. Manually verified all installability criteria
  instead. Best Practices score = 1.0.
- **40-route walkthrough** — `scripts/run_walkthrough.py` → **40/40 PASSED**
  (20 public routes × 2 tenants, all HTTP 200, no error text).
- **Build + lint** — `npm run build` exit 0, `npx eslint src/ --ext .ts,.tsx` exit 0.

## 2. Currently In-Progress / Open Items

- **Part 2 (Web SaaS platform) is COMPLETE.** apple-touch-icon added, Lighthouse
  manual-verification accepted. Open items below are for the NEXT phase
  (production deployment), not blockers.
- **Next phase: PRODUCTION DEPLOYMENT** (separate work). Requires real hosted
  accounts (Supabase project + Vercel). See .env.example for required env vars.
- **Flutter mobile app is a LATER phase** — NOT started, do not begin yet.

## 3. Verified-Working Checklist

| Check | Status | Proof |
|---|---|---|
| Docker + local Supabase stack | ✅ | 9 containers healthy, migrations applied |
| Test tenants restored (A/B) | ✅ | slugs + branding + content + icons + admins |
| Manifest per tenant (different) | ✅ | side-by-side curl (A: #7C3AED, B: #059669) |
| 8 PWA icons per tenant, maskable 192/512 | ✅ | DB 8 rows each; URLs 200 image/png |
| Service worker per tenant scope | ✅ | Playwright: scope + scriptURL + cache names |
| Cache-busting via sw_cache_version | ✅ | v2→v3, public page updated, B isolated |
| Lighthouse PWA audit | 🔶 manual only | v12 removed the category; manual criteria pass |
| 40-route walkthrough | ✅ | 40/40 HTTP 200 |
| `npm run build` | ✅ | exit 0 |
| `npx eslint src/ --ext .ts,.tsx` | ✅ | exit 0 |

## 4. Environment / Sandbox Constraints

- **node_modules does NOT persist** across sessions — run `npm install` again first.
- **`.git/config` (remote) does NOT persist** — re-add origin after a fresh session:
  `git remote add origin https://github.com/mbilalshakeel/islamic-academy-saas.git`.
- **Docker daemon does NOT auto-start** — start it: `sudo dockerd > /tmp/dockerd.log 2>&1 &`
  then `sudo chmod 666 /var/run/docker.sock`. Then `supabase start`.
- **Supabase CLI binary lives at** `/home/user/supabase` (v1.210.0).
- **Playwright chromium** installed at `~/.cache/ms-playwright` (may need reinstall).
- **Dev server (production build)** currently started with `npm run start -- -p 3000`.

## 5. Commit/Push Status

- Commits on `main`: `da34d6b` (base), `132ddb9` (handleGenerateIcons fix), and
  the next commit adds this PWA verification + scripts + updated screenshots.

## 6. Literal Next Step Expected From Me

1. ✅ Auth hook enabled by user; verified working (JWT claims correct).
2. ✅ Super Admin Panel verified; real test tenant "Test Academy" created + seeded.
3. **NEXT (final step):** Vercel deployment of the Next.js app. User will provide
   Vercel access / a way to deploy. Env vars needed (from .env.example): the hosted
   Supabase URL, anon key, service_role key, JWT secret, APP_BASE_DOMAIN, CRON_SECRET.
4. Do NOT start Flutter until explicitly instructed.

### PRODUCTION SMOKE TEST — COMPLETE (2026-08-06) — DEPLOYED & VERIFIED LIVE
- **Vercel deployment LIVE:** `https://islamic-academy-saas.vercel.app` (production), connected via Vercel API token (project `islamic-academy-saas`).
- **Root cause fixed:** Vercel env var `SUPABASE_JWT_SECRET` was EMPTY -> public app theme/content read failed. After setting it correctly:
  - theme-color + manifest now `#B91C1C` (matches DB), sw.js `CACHE_VERSION=3` (matches DB).
  - Names page renders (Ar-Rahman), hadith edit live in public HTML ("PROD SMOKE TEST EDITED").
  - dhikr-items + calendar-events public APIs return seeded data.
- **Super Admin Panel** (production): login OK, dashboard shows both tenants (template + Test Academy), content counts correct.
- **Institute Admin Panel** (Test Academy): login OK, theme customizer works, hadith CRUD works, edit persisted + sw_cache bumped (1->2->3), PWA icons generated (8 sizes, manifest confirms).
- **Public app** (Test Academy): all 15 routes HTTP 200, theme applied, content live.
- **Env vars set on Vercel:** NEXT_PUBLIC_SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY, JWT_SECRET, APP_BASE_DOMAIN, CRON_SECRET (all production+preview).
- **Note:** impersonation_grants created via Super Admin UI (View-as-Tenant) on demand; DB currently empty (no grant active) - expected.
- **Note:** manifest/pages use CDN caching (max-age=60); a fresh edit shows after up to ~60s. Cache-buster query param confirms fresh data immediately.

### PART 3 — FLUTTER MOBILE APP — SUB 1-7 BUILT, APK COMPILES (2026-08-06)
- **Sub-1 (project + Supabase integration):** `mobile/ici_platform_app` Flutter project.
  Supabase service (anon key, RLS), Hive CacheService, ContentService (cache-first),
  ThemeService (dynamic branding), NotificationService (FCM scaffold), Sehri/Iftar service.
- **Sub-2/3 (core + content screens):** Splash, Home (reading/learning grids + books
  carousel + bottom nav), Quran (list+PDF), Qaida, Names, Duas, Hadith, Pillars, Prayers,
  Books, Q&A, About, Contact, Tools (Sehri/Iftar, Dhikr, Hijri, Zakat), Settings.
- **Sub-4 (theming/dark/lang):** dynamic ThemeData from tenant_branding, dark mode toggle,
  EN/UR language switch, font-size slider.
- **Sub-5 (offline/Hive):** content + branding + prefs cached in Hive; background
  sw_cache_version refresh; dhikr count persisted.
- **Sub-6 (white-label):** `lib/flavors/app_config.dart` uses --dart-define injection
  (TENANT_ID/SLUG/APP_NAME/COLORS/LOGO/PACKAGE); `build_client.sh` helper; README documents
  the per-client 15-min process.
- **Sub-7 (FCM):** NotificationService scaffold (permission, token, local notifications).
- **PROOF:** `flutter analyze` clean; **`flutter build apk --debug` SUCCEEDED** →
  `build/app/outputs/flutter-apk/app-debug.apk` (valid APK, 97MB debug, AndroidManifest present).
- **ENV notes:** installed Flutter 3.24.5, OpenJDK 21, Android SDK 34/35, added swap for
  Gradle OOM; patched app_links compileSdk; removed pdfx (Flutter-engine incompatible; PDF
  opens via url_launcher like web); enabled core-library desugaring for flutter_local_notifications;
  upgraded AGP 8.5.2 + Gradle 8.7.
- **Remaining:** Sub-8 (full README + deployment guide — partially done in mobile/README.md);
  release-signing keystore; iOS build (needs macOS); run on emulator (needs device/AVD).
