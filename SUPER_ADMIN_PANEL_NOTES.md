# Super Admin Panel — Delivery Notes

## What was built

### 1. Separate platform-admin login (`/platform-admin/login`)
- Own page, own API route (`POST /api/platform-admin/login`) — does **not** share code
  with the tenant-admin login flow.
- After password auth succeeds against Supabase Auth, the route independently
  re-checks the resulting JWT: rejects (403 + immediate sign-out) unless
  `is_platform_admin === true` **and** `tenant_id` is absent. A tenant admin's
  correct credentials are provably rejected here (tested — see below).
- Enforced again by `custom_access_token_hook`, hardened this session so a
  platform_admin **never** gets a `tenant_id` claim, even defensively against a
  stray/duplicate `users` row for the same account.

### 2. Dashboard (`/platform-admin/dashboard`)
Table of all tenants: name, slug, status (color-coded), plan, created date, and a
content-health check (hadith/dua/admin-user counts per tenant), pulled live via
`service_role` (the only place in the app that key is used, and only behind the
`requirePlatformAdmin()` guard).

### 3. "Create New Tenant" (`/platform-admin/tenants/new`)
Live slug auto-suggest from institute name + debounced uniqueness check. On submit,
one route performs, in order: create tenant row → `seed_tenant_defaults()` →
upsert `tenant_branding` (personalized name/tagline over the seeded template
defaults) → `inviteUserByEmail()` (magic-link invite, no plaintext password ever
generated or logged) → insert the `users` row linking that account as `owner`.
If any step fails, the tenant row is deleted (cascade cleans up everything else)
so a half-created tenant is never left behind — verified by an actual induced
failure during testing (see below).

### 4. Per-tenant actions: Suspend / Reactivate / Delete / View as tenant
- **Delete** requires re-typing the tenant's exact slug (modal), then cascades via
  each content table's `tenant_id` FK; auth accounts are cleaned up separately
  since GoTrue users aren't part of the same cascade.
- **View as tenant** — see security note below.

### 5. Route + API guarding
Every `/platform-admin/**` page is gated by middleware (redirects non-platform-admins
to `/platform-admin/login`); every `/api/platform-admin/**` route independently calls
`requirePlatformAdmin()`, which does a **live** DB check (`am_i_platform_admin()`),
not just a JWT-claim check — closing the staleness gap where a deactivated platform
admin's still-valid JWT could keep working for up to an hour otherwise.

---

## Proof it actually works (all tests run against the live app, not scripts)

1. **Tenant-admin login rejected at platform-admin login**: confirmed 403
   `"This account is not a platform administrator."` using Masjid An-Noor's real,
   correct credentials.
2. **Real platform admin logs in**, dashboard lists all 3 existing tenants with
   correct live content-health counts (40 hadiths / 45 duas each).
3. **Full click-through tenant creation** via Playwright driving the actual browser
   UI (screenshots in `screenshots/`): typed "Al-Huda Islamic Academy" → slug
   auto-suggested `al-huda-islamic-academy` and confirmed available → filled admin
   email + plan → submitted → success screen.
4. **Verified fully seeded at the DB layer**: 196 divine_names, 40 hadiths, 45 duas,
   5 pillars, 5 prayers, 15 qa_items, 3 books, 11 home_menu_items, 1 personalized
   branding row — exact match to the template tenant's counts.
5. **Real invite email** landed in Inbucket (local email test server), followed the
   actual invite link, set a password, and **logged in through the app's normal
   tenant-admin login route** — fetched that tenant's own hadiths and got back only
   their own data. This brand-new tenant behaves identically to our earlier
   manually-provisioned ones.
6. **Delete cascade verified**: after deleting the demo tenant, 0 rows remain across
   tenants/hadiths/users for that id.
7. **Security sweep** — a real Masjid An-Noor tenant-admin session was used to hit
   every platform-admin surface directly:
   - Dashboard page → redirected to `/platform-admin/login`
   - List tenants API → 403 "Not a platform admin"
   - Create tenant API → 403
   - Suspend another tenant → 403
   - Delete another tenant → 403
   - Impersonate another tenant → 403
   - Same suite repeated fully unauthenticated (no session) → also blocked

---

## Design trade-offs

- **Per-tenant-row content counts on the dashboard** run one query per tenant per
  metric. Fine at current scale (a handful of tenants); would need to become a
  single aggregated query (or a materialized view refreshed periodically) before
  this scales to hundreds of tenants.
- **Delete confirmation is slug re-entry**, not a second factor / cooldown window.
  Matches common "type the name to confirm" patterns but there's no soft-delete or
  recovery window — deletion is immediate and permanent. Worth adding a
  soft-delete/trash-with-expiry phase before this goes to production with real
  customer data.
- **Invite-email-only account creation** (no password shown once) was chosen over
  generating a temporary password, specifically so no plaintext credential is ever
  generated by, or passes through, our own server/logs. Trade-off: it depends on
  the tenant's admin actually receiving and clicking the email — no immediate
  "logged in and working" moment for the platform admin creating the tenant on
  someone's behalf over a call, for instance.

## 🔒 Security considerations — flagged explicitly, as requested

- **"View as tenant" is intentionally NOT a session swap.** It does not mint a
  tenant-scoped JWT for the platform admin. Instead it (a) requires a typed reason,
  (b) writes an audited `impersonation_grants` row with a 30-minute expiry, and
  (c) serves data through a dedicated **read-only** viewer route that re-validates
  the grant is live (not expired/revoked) on every single request. The platform
  admin never receives write-capable access to a tenant's data through this
  feature. **Trade-off**: this means it cannot be used to reproduce a
  write-related bug a tenant reports, or exercise the tenant's own admin UI
  pixel-for-pixel — if that's needed later, it should be built as its own
  reviewed feature (e.g. a genuine, doubly-audited session swap with mandatory
  time-boxing and forced write-action logging), not extended from this one.
- **`service_role` key exposure surface**: it is used in exactly one file
  (`service-role.ts`), imported only by `/api/platform-admin/**` routes, each
  independently gated by a live DB check. There is no technical barrier (e.g. a
  build-time lint rule) currently preventing a future contributor from importing
  it elsewhere by mistake — this is presently a code-review/discipline boundary,
  not an enforced one. Recommend adding an ESLint rule restricting imports of
  `service-role.ts` to `src/app/api/platform-admin/**` before this ships.
- **`impersonation_grants` and `platform_admins` tables** have zero Postgres
  grants to `anon`/`authenticated` — only reachable via `service_role` from
  already-gated route code, mirroring the lockdown pattern already proven for
  `platform_admins` earlier in this project.
- **Tenant deletion is irreversible** (see trade-off above) — flagging again here
  because it's the single most destructive action exposed by this panel.
