# PROGRESS.md — ICI Multi-Tenant Web Platform (PWA Phase)

> Resume point for a fresh session. Read this FIRST before touching code.
> Maintained after every meaningful chunk of work. Last updated: 2026-08-05.

---

## 1. Last Completed Step

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

1. ✅ **Commit + push** the apple-touch-icon fix + .env.example + PROGRESS.md.
2. **Part 2 complete.** Await deployment instructions from the user (they create
   hosted Supabase + Vercel accounts). When ready:
   - Set env vars (see .env.example) in production.
   - New Supabase project → run supabase/migrations in order → template tenant
     auto-seeded (migration 014) → `seed_tenant_defaults()` per new tenant.
   - Deploy Next.js to Vercel.
3. Do NOT start Flutter until explicitly instructed.
