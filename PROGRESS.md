# PROGRESS.md — ICI Multi-Tenant Web Platform (PWA Phase)

> Resume point for a fresh session. Read this FIRST before touching code.
> Maintained after every meaningful chunk of work. Last updated: 2026-08-03.

---

## 1. Last Completed Step

- **Repo cloned** from `https://github.com/mbilalshakeel/islamic-academy-saas.git`
  at commit `da34d6b` (feat(pwa): dynamic per-tenant manifest, server-side PWA
  icon generation, SW caching).
- **Dependencies installed** (`npm install` — 604 packages).
- **`.env.local` created** from the values documented in `PROJECT_STATUS.md`
  (local Supabase URLs + anon/service-role keys).
- **`npm run build` executed** → initially **FAILED**, then **FIXED and PASSED** (see section 2).
- **`npx eslint src/ --ext .ts,.tsx` executed** → **PASSED clean** (exit 0, no output).

## 2. Currently In-Progress / Next Edit (mid-task)

- **PWA phase verification is NOT yet done end-to-end.** Code exists for:
  manifest route, service worker route, PwaRegistrar, pwa-icons, bump-cache-version,
  and the theme-customizer "Generate PWA Icons" button — but **none of it has been
  proven/run in this fresh session**, and the project currently **does not build**.

- **BLOCKER — FIXED ✅ (2026-08-03):**
  `src/app/t/[slug]/admin/settings/theme/page.tsx`
  - Was: line 326 referenced `onClick={handleGenerateIcons}` but the function was
    never defined → build failed with `Type error: Cannot find name 'handleGenerateIcons'.`
  - Fix: added an async `handleGenerateIcons` function (after `handleSave`) that
    calls `POST /api/tenant-admin/branding/generate-icons`, toggles `generatingIcons`,
    sets `error` on failure, and sets `iconsGeneratedMsg` ("Generated N PWA icon(s).")
    on success.
  - Verified: `npm run build` now passes (exit 0), `npx eslint src/ --ext .ts,.tsx` clean (exit 0).
  - NOTE: next task is to commit + push this fix.

## 2b. Environment note (CRITICAL for future turns)
- **node_modules does NOT persist across sessions/turns** (excluded from snapshots).
  After any long gap, run `npm install` again before `npm run build`.

## 3. Verified-Working Checklist (only what is actually proven)

| Check | Status | Proof |
|---|---|---|
| `npm install` | ✅ works | 604 packages installed |
| `npx eslint src/ --ext .ts,.tsx` | ✅ clean | exit 0, no errors |
| `npm run build` | ✅ PASSES | fixed `handleGenerateIcons` (theme/page.tsx) |
| Local Supabase stack + migrations | ⛔ NOT SET UP | no Docker/Supabase CLI in sandbox |
| Test tenants (masjid-noor, darul-uloom) | ⛔ NOT RESTORED | DB never started |
| Manifest per tenant | 🔶 code exists, UNPROVEN | file reviewed only |
| Service worker per tenant | 🔶 code exists, UNPROVEN | file reviewed only |
| tenant_pwa_icons generation | 🔶 code exists, UNPROVEN | file reviewed only |
| Cache-busting (sw_cache_version) | 🔶 code exists, UNPROVEN | wiring reviewed only |
| Lighthouse PWA audit | ⛔ NOT RUN | needs running app |
| 40-route walkthrough | ⛔ NOT RUN | needs running app + DB |

## 4. Key Facts About the PWA Implementation (from file review)

- **manifest.json route**: `src/app/t/[slug]/manifest.json/route.ts` — loads tenant
  via `getPublicTenantContext`, builds per-tenant name/short_name/colors/start_url/
  scope, marks 192/512 icons as `any maskable`.
- **service worker route**: `src/app/t/[slug]/sw.js/route.ts` — tenant-scoped cache
  name `ici-[slug]-v[sw_cache_version]`, network-first for HTML, stale-while-revalidate
  for assets, `Service-Worker-Allowed` header, purges only own tenant's old caches.
- **registrar**: `src/components/PwaRegistrar.tsx` — wired into `(public)/layout.tsx`
  alongside `<link rel="manifest">`, theme-color meta, Apple tags.
- **icon generator**: `src/lib/pwa-icons.ts` (sharp, sizes 72–512) +
  `generate-icons` route + theme-customizer button.
- **cache-bump**: `src/lib/bump-cache-version.ts` — wired into pages, resource/[table]/[id],
  reorder, and resource/[table] routes.
- **DB schema**: migration `003_branding_and_pwa.sql` defines `tenant_branding.sw_cache_version`
  (default '1') and `tenant_pwa_icons` (size check 72..512, unique(tenant_id,size,purpose)).

## 5. Environment / Sandbox Constraints

- **No Docker and no Supabase CLI** installed in this sandbox — do NOT attempt to install Docker.
- **No dev server running**, nothing on ports 3000 / 54321 / 54322.
- **DECISION (2026-08-03):** user is setting up a **hosted/remote Supabase project**
  and will provide URL + anon + service-role keys. WAIT for those credentials
  before doing any DB-dependent task. Do not start Docker.

## 6. Literal Next Step Expected From Me

1. ✅ **Fix the build blocker** in `src/app/t/[slug]/admin/settings/theme/page.tsx`
   (implement `handleGenerateIcons`) — DONE, build + lint pass.
2. **Commit + push** the build fix (theme/page.tsx) and this PROGRESS.md.
3. **WAIT** for the user's hosted Supabase URL + keys. Then set `.env.local` to
   those remote values, apply migrations (`supabase/migrations/*`), and restore
   test tenants (masjid-noor / darul-uloom) with branding + pwa icons.
4. Run the PWA proof: side-by-side manifests, SW registration per tenant,
   admin-edit → cache refresh, Lighthouse audit, 40-route regression.
5. Commit + push every step; keep this PROGRESS.md updated.
