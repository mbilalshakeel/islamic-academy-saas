# Proof of Tenant Isolation — Application Layer

All tests below were run against the **actual running Next.js app** (`npm run dev`,
port 3000), talking to a real local Supabase stack (Postgres + GoTrue Auth +
PostgREST), using **only the public anon key** — the app never uses `service_role`.

Test tenants (already provisioned via `seed_tenant_defaults()`):
- **Tenant A**: Masjid An-Noor — `admin@masjid-noor.test`
- **Tenant B**: Darul Uloom Academy — `admin@darul-uloom.test`

---

## Test 1 — Real login as Tenant A

`POST /api/auth/login` (real Next.js route, sets httpOnly session cookies via
`@supabase/ssr`, backed by GoTrue):

```json
{
    "ok": true,
    "user_id": "b35e29c1-eddb-4ea0-8c4f-a2fce84b756e",
    "email": "admin@masjid-noor.test",
    "tenant_id": "5b1ac16d-baaf-4498-8f7e-fbc5205ec673",
    "tenant_role": "owner"
}
```

`tenant_id` was injected automatically by the `custom_access_token_hook` Postgres
function GoTrue calls before signing the JWT — never supplied by the client.

## Test 2 — Fetch Tenant A's own data through the app

`GET /api/tenant-admin/hadiths` (session cookie from Test 1):
- Returned 5 hadiths, all with `tenant_id: 5b1ac16d-...` (Tenant A's own id)

`GET /api/tenant-admin/duas`:
- Returned 5 duas (Ayat-ul-Kursi, Dua-e-Qunoot, Dua e Subah, Kalima Tayyiba,
  Iman-e-Mujmal), all with `tenant_id: 5b1ac16d-...`

## Test 3 — Real login as Tenant B, confirm separate data

`POST /api/auth/login` as `admin@darul-uloom.test`:
```json
{
    "ok": true,
    "tenant_id": "60472897-3ad4-44ce-a533-60eef7e0db14",
    "tenant_role": "owner"
}
```

`GET /api/tenant-admin/hadiths` (Tenant B's session):
- Returned 5 hadiths — same seeded *text* as Tenant A (both came from the same
  template), but **completely different row `id`s and a different `tenant_id`**
  — proving these are independent copies, not a shared view.

**Independence proven by mutation**: Tenant A edited their own Hadith #1 via
`PATCH /api/tenant-admin/hadiths`:
- Tenant A's copy afterward: `"EDITED BY MASJID AN-NOOR ADMIN"`
- Tenant B's copy, re-fetched immediately after: **unchanged**,
  `"Actions are but by intentions and every man shall have only that which he intended."`

## Test 4 — Deliberate attack test (Tenant A session → Tenant B data)

`POST /api/tenant-admin/attack-test` while authenticated as Tenant A, targeting
Tenant B's real tenant_id and a real row id:

| Attack | Result |
|---|---|
| **1. SELECT filtered on forged `tenant_id`** (Tenant B's id) | `0 rows returned` — RLS silently filters it out |
| **2. INSERT with forged `tenant_id`** (claiming to be Tenant B) | Row **was inserted**, but the `stamp_tenant_id()` trigger silently overwrote the tenant_id back to the attacker's own tenant (`5b1ac16d-...`, Tenant A) — the forged value never survives |
| **3. UPDATE targeting victim's row by exact primary key** (no tenant_id involved at all) | `0 rows affected` — RLS matches zero rows even though the ID is exact and correct |
| **4. Unfiltered `SELECT *`** (no filters, "give me everything") | `41` rows returned (40 own + the attack-2 leftover before cleanup), **all** with `distinct_tenant_ids_seen: ["5b1ac16d-..."]` — i.e. only ever the attacker's own tenant, never Tenant B's |

**Route-guard layer, tested independently of the data layer:**
- Tenant A visiting their own `/t/masjid-noor/admin` → `200 OK`
- Tenant A visiting `/t/darul-uloom/admin` (Tenant B's admin URL) → redirected to
  `/unauthorized` (`403`) by middleware, before any query is even attempted

---

## Conclusion

Two independent layers both hold under direct attack, exercised through real
application code (not raw SQL):

1. **Middleware / routing layer** — blocks a tenant admin from ever loading
   another tenant's admin URL, by comparing the session's own `tenant_id` claim
   against the tenant resolved from the URL.
2. **Database RLS layer** — even if the routing layer were bypassed entirely,
   Postgres Row-Level Security + the `stamp_tenant_id()` trigger make it
   structurally impossible to read, overwrite, or plant data under another
   tenant's `tenant_id`, regardless of what the client sends.
