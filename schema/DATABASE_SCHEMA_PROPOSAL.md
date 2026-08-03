# Multi-Tenant Database Schema Proposal
### Islamic Coaching Institute PWA → Multi-Tenant Platform

Status: **DESIGN REVIEW ONLY — no implementation yet**
Target engine: PostgreSQL (assumes Supabase-style auth/JWT + native Row Level Security; the design works equally on plain Postgres with a session GUC if you're not using Supabase)

---

## 0. Design Principles

1. **Every content table carries `tenant_id`** (uuid, `NOT NULL`, FK → `tenants.id ON DELETE CASCADE`).
2. **UUID primary keys everywhere** (`gen_random_uuid()`) — avoids sequential-ID enumeration across tenants.
3. **`sort_order` + `is_active`** on every list-style content table, so the future admin panel can reorder/hide items without deleting data.
4. **`created_at` / `updated_at` / `updated_by`** on every table for audit trail.
5. Tables are grouped by domain: **Platform**, **Quran/Qaida**, **Names**, **Duas**, **Hadith/Books**, **Pillars**, **Prayers**, **Q&A**, **Static Pages/Contact**, **Home Menu Config**.
6. A **reserved "template" tenant** holds your current default content — new tenants are seeded by copying from it (details in §4).

---

## 1. Full Table List

### A. Platform & Tenancy (no tenant_id — these define tenants)

**`tenants`**
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| slug | text UNIQUE | subdomain / URL path, e.g. `ici`, `masjid-noor` |
| custom_domain | text UNIQUE NULL | optional white-label domain |
| name | text | e.g. "Islamic Coaching Institute" |
| status | enum(`trial`,`active`,`suspended`,`cancelled`) | |
| plan | text | for future billing tiers |
| is_template | boolean DEFAULT false | **true only for the one reserved "default content" tenant** |
| timezone | text | |
| default_language | text | e.g. `en`, `ur` |
| created_at, updated_at | timestamptz | |

**`platform_admins`**
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| email | text UNIQUE | |
| password_hash / auth_provider_id | | |
| role | enum(`super_admin`,`support`) | |
| created_at | timestamptz | |

> Not tenant-scoped by design — this is *your* team's cross-tenant access (support, tenant provisioning, billing). Never exposed to tenant admins.

**`users`** *(tenant admin-panel accounts)*
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK → tenants | **NOT NULL** |
| email | text | |
| password_hash / auth_provider_id | | |
| role | enum(`owner`,`admin`,`editor`,`viewer`) | |
| created_at, updated_at | | |
| UNIQUE(tenant_id, email) | | |

---

### B. Tenant Branding / PWA (drives `manifest.json` + `sw.js` generation)

**`tenant_branding`** *(1:1 with tenant)*
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK UNIQUE | |
| app_name | text | manifest `name` |
| short_name | text | manifest `short_name` |
| tagline | text | |
| description | text | manifest `description` |
| theme_color | text | manifest `theme_color` / meta tag |
| background_color | text | manifest `background_color` |
| primary_color_hex, secondary_color_hex | text | drives Tailwind CSS var overrides |
| favicon_url | text | |
| logo_url | text | |
| sw_cache_version | text/int | **bumped whenever tenant content/branding changes** → forces `sw.js` to invalidate old cache |
| updated_at | | |

**`tenant_pwa_icons`** *(1:many — manifest needs multiple sizes)*
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| size | int | 72,96,128,144,152,192,384,512 |
| url | text | |
| purpose | enum(`any`,`maskable`) | |

---

### C. Quran & Qaida

**`quran_editions`**
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| name | text | "16 Line Quran", "15 Line Quran" |
| line_count | int | 16 / 15 |
| sort_order | int | |
| is_active | boolean | |

**`quran_paras`**
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| edition_id | uuid FK → quran_editions | |
| para_number | int (1–30) | |
| name_arabic | text | |
| file_provider | enum(`google_drive`,`url`,`upload`) | |
| file_reference | text | Drive file ID or full URL |
| sort_order | int | |
| UNIQUE(edition_id, para_number) | | |

**`qaida_courses`**
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| name | text | "Noorani Qaida", "Qurani Qaida" |
| level_label | text | "Beginner", "Intermediate" |
| color_theme | text | |
| file_provider | enum(`google_drive`,`url`,`upload`,`none`) | `none` = unwired/coming-soon, like current "Qurani Qaida" |
| file_reference | text NULL | |
| sort_order | int | |
| is_active | boolean | |

---

### D. Names (Asma-ul-Husna & Prophet's Names)

**`divine_names`** *(unified table — same shape for both lists)*
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| category | enum(`allah`,`prophet`) | distinguishes the two 99-name sets |
| order_index | int (1–99) | |
| arabic | text | |
| transliteration | text | |
| meaning_en | text | |
| meaning_extra | text NULL | optional longer explanation |
| UNIQUE(tenant_id, category, order_index) | | |

---

### E. Duas (Masnoon Duas, Kalimas, Ayat-ul-Kursi, Dua-e-Qunoot, Iman-e-Mujmal/Mufassal)

**`dua_categories`**
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| slug | text | `masnoon`, `kalimas`, `ayat_kursi`, `dua_qunoot`, `iman_mujmal`, `iman_mufassal` |
| title | text | |
| icon | text | |
| display_type | enum(`list_screen`,`modal`) | matches current UX (Masnoon = own screen, others = modal) |
| sort_order | int | |
| UNIQUE(tenant_id, slug) | | |

**`duas`**
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| category_id | uuid FK → dua_categories | |
| title | text | e.g. "Dua e Subah" |
| subtitle | text | e.g. "Morning Dua" |
| arabic_text | text | |
| translation_en | text | |
| icon | text | |
| numbered_position | int NULL | for the 6 Kalimas (1–6) |
| sort_order | int | |

---

### F. Hadith & Islamic Books

**`hadith_collections`** *(future-proofs for more than one 40-hadith set, e.g. Nawawi vs Qudsi)*
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| name | text | "40 Hadiths" |
| sort_order | int | |

**`hadiths`**
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| collection_id | uuid FK → hadith_collections | |
| hadith_number | int | |
| text_en | text | |
| text_arabic | text NULL | future-proof, not in current data |
| narrator | text NULL | |
| sort_order | int | |

**`books`** *(the "Islamic Books" catalogue — currently unwired, becomes live once DB-driven)*
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| title | text | |
| author | text | |
| description | text NULL | |
| category | enum(`hadith`,`seerah`,`tafsir`,`fiqh`,`other`) | |
| language_tags | text[] | e.g. `{Arabic,Urdu}` |
| cover_icon | text | |
| cover_gradient | text | |
| file_provider | enum(`google_drive`,`url`,`none`) | |
| file_reference | text NULL | |
| sort_order | int | |
| is_active | boolean | |

---

### G. Pillars of Islam

**`pillars`**
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| slug | text | `shahada`,`salah`,`zakat`,`sawm`,`hajj` |
| title | text | |
| arabic_text | text NULL | |
| description | text | |
| sort_order | int | |
| UNIQUE(tenant_id, slug) | | |

**`pillar_details`** *(the bullet-point list per pillar)*
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| pillar_id | uuid FK → pillars | |
| detail_text | text | |
| sort_order | int | |

---

### H. Prayers / Salah

**`prayers`**
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| name | text | Fajr, Dhuhr, Asr, Maghrib, Isha |
| rakat_fard | int | |
| rakat_sunnah | int | |
| rakat_nafl | int NULL | |
| rakat_witr | int NULL | |
| sort_order | int | |

**`ritual_guides`** *(Wudu steps, "How to Perform" namaz steps, Namaz Lesson content)*
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| guide_type | enum(`wudu`,`namaz_how_to`,`namaz_lesson`) | |
| title | text | |
| intro_text | text NULL | |
| sort_order | int | |

**`ritual_guide_steps`**
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| guide_id | uuid FK → ritual_guides | |
| step_number | int | |
| title | text | |
| description | text | |

---

### I. Q&A

**`qa_items`**
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| category | enum(`namaz`,`quran`,`roza`,`zakat`,`aqaid`) | matches existing filter tabs |
| question | text | |
| answer | text | |
| sort_order | int | |
| is_active | boolean | |

---

### J. Static Pages / Contact / Home Config

**`site_pages`** *(About, Contact hero, Home hero — loosely-structured content)*
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| page_key | enum(`about`,`home_hero`) | |
| hero_title | text NULL | |
| hero_subtitle | text NULL | |
| content_blocks | jsonb | ordered array of `{type, text}` blocks — paragraphs, offer-list items, credits |
| UNIQUE(tenant_id, page_key) | | |

**`contact_channels`** *(normalized instead of JSON — admin panel can add/remove rows cleanly)*
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| channel_type | enum(`phone`,`email`,`social`,`working_hours`) | |
| label | text | e.g. "Instagram", "Sat–Thu" |
| value | text | phone number / email / URL / hours text |
| icon | text NULL | |
| sort_order | int | |

**`home_menu_items`** *(recommended addition — lets each tenant toggle/reorder/relabel dashboard cards without code changes)*
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| module_key | enum(`quran_16line`,`quran_15line`,`qaida`,`daily_duas`,`allah_names`,`prophet_names`,`hadith`,`pillars`,`islamic_knowledge`,`prayers`,`books`) | maps to a fixed, code-known feature |
| section | enum(`reading`,`learning`) | which dashboard column it lives in |
| custom_label | text NULL | overrides default label |
| is_enabled | boolean DEFAULT true | e.g. tenant can hide "Islamic Knowledge" until it's built |
| sort_order | int | |
| UNIQUE(tenant_id, module_key) | | |

> This table is optional relative to your original ask, but since we're going multi-tenant anyway, it means a masjid that doesn't want a Qaida section, or wants "Duas" renamed to "Duain", doesn't need a code deploy — just an admin panel toggle. Flag if you'd rather skip this for v1 and hardcode the menu.

---

## 2. Relationships (ER Summary)

```
tenants (1) ──< tenant_branding (1)
tenants (1) ──< tenant_pwa_icons (many)
tenants (1) ──< users (many)
tenants (1) ──< quran_editions (many) ──< quran_paras (many)
tenants (1) ──< qaida_courses (many)
tenants (1) ──< divine_names (many)                [category: allah | prophet]
tenants (1) ──< dua_categories (many) ──< duas (many)
tenants (1) ──< hadith_collections (many) ──< hadiths (many)
tenants (1) ──< books (many)
tenants (1) ──< pillars (many) ──< pillar_details (many)
tenants (1) ──< prayers (many)
tenants (1) ──< ritual_guides (many) ──< ritual_guide_steps (many)
tenants (1) ──< qa_items (many)
tenants (1) ──< site_pages (many)
tenants (1) ──< contact_channels (many)
tenants (1) ──< home_menu_items (many)

platform_admins  →  NOT tied to any tenant (cross-tenant support/provisioning role)
```

Every arrow from `tenants` is `ON DELETE CASCADE` — deleting/off-boarding a tenant cleanly removes all of its content, no orphaned rows.

Total: **~23 tables** (2 platform-level, 1 branding pair, 20 tenant-scoped content tables).

---

## 3. Row Level Security (RLS) Plan

### 3.1 How tenant identity reaches Postgres

- Each authenticated request (admin panel or the public PWA's read API) carries a **JWT** with a `tenant_id` claim, set at login/session time after verifying which tenant the user (or the public site domain/slug) belongs to.
- A SQL helper function reads that claim into a usable value:

```sql
create or replace function current_tenant_id() returns uuid
language sql stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id', ''),
    nullif(current_setting('app.tenant_id', true), '')
  )::uuid
$$;
```

  (Supabase-style JWT claim as primary source; a plain session GUC `app.tenant_id` as fallback for non-Supabase/plain-Postgres deployments or background jobs.)

- **Public-facing reads for the PWA itself** (anonymous visitors reading Quran/duas/hadith) are resolved by tenant **slug/domain → tenant_id** at the API/edge layer *before* hitting the DB, then that tenant_id is what's placed in the session — anonymous users never get to pick their own tenant_id.

### 3.2 Policy pattern (applied identically to every content table)

```sql
alter table <table> enable row level security;
alter table <table> force row level security;  -- applies even to the table owner role

create policy tenant_read on <table>
  for select
  using (tenant_id = current_tenant_id());

create policy tenant_insert on <table>
  for insert
  with check (tenant_id = current_tenant_id());

create policy tenant_update on <table>
  for update
  using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());

create policy tenant_delete on <table>
  for delete
  using (tenant_id = current_tenant_id());
```

### 3.3 Defense-in-depth against a bad/forged `tenant_id` on writes

Even with `WITH CHECK`, a bug in application code could theoretically send the *wrong* (but still valid-looking) `tenant_id` for the authenticated tenant to spoof another. To close that gap, a trigger **overwrites** `tenant_id` server-side rather than trusting client input:

```sql
create or replace function stamp_tenant_id() returns trigger
language plpgsql as $$
begin
  new.tenant_id := current_tenant_id();
  return new;
end;
$$;

create trigger trg_stamp_tenant_id
  before insert on <table>
  for each row execute function stamp_tenant_id();
```

Applied to every content table → the row's `tenant_id` is **always** derived from the session identity, never from client payload.

### 3.4 Cross-tenant access for platform admins / seeding jobs

- `platform_admins` and the tenant-provisioning/seeding service use a **separate, elevated Postgres role** (e.g. Supabase's `service_role`, which has `BYPASSRLS`), used **only in trusted backend code** (tenant creation, support tooling) — **never exposed to the public API or the tenant admin panel**.
- The tenant admin panel and the public PWA API always connect as a restricted role (`authenticated` / `anon`) that is subject to RLS with no bypass.
- This gives two hard boundaries: (1) RLS policies stop tenant-vs-tenant leakage, (2) role separation stops the seeding/support tooling from being reachable by tenant-level credentials.

### 3.5 Uniqueness & indexing

- All `UNIQUE` constraints on content tables are **scoped to tenant**: `UNIQUE(tenant_id, slug)` etc. — two tenants can each have a pillar with slug `salah` independently.
- Every content table gets a composite index `(tenant_id, sort_order)` or `(tenant_id, <lookup column>)` to keep tenant-filtered queries fast as the platform scales.

---

## 4. Seeding a Brand-New Tenant with Default Content

### 4.1 The "Template Tenant" pattern

- One reserved row in `tenants` has `is_template = true` (e.g. a fixed, well-known UUID). This row holds a full, working copy of **all your current default content** — every one of the 99 Allah names, 99 Prophet names, 40 hadiths, all Masnoon duas, Kalimas, pillars, prayers, Q&A, etc. — entered exactly once.
- This template tenant is excluded from normal tenant listings/billing and is never itself served to end users; it exists purely as the "gold master" default dataset, editable through the same admin panel tooling (so updating a hadith translation platform-wide-by-default only requires editing the template tenant's row once — future tenants inherit the fix; existing tenants keep their own copies unless you explicitly re-sync them).

### 4.2 Provisioning flow when a new tenant signs up

1. Insert the new row into `tenants` (`is_template = false`).
2. Insert a default `tenant_branding` row (generic placeholder colors/name, or a copy of the template's branding) + placeholder `tenant_pwa_icons`.
3. Run a single seeding routine — a `SECURITY DEFINER` Postgres function (executed under the elevated/bypass-RLS role, §3.4) — that copies every content table from the template tenant into the new tenant, generating fresh primary keys and rewriting `tenant_id`:

```sql
create or replace function seed_tenant_defaults(p_new_tenant_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_template_id uuid := (select id from tenants where is_template limit 1);
begin
  insert into quran_editions (tenant_id, name, line_count, sort_order, is_active)
    select p_new_tenant_id, name, line_count, sort_order, is_active
    from quran_editions where tenant_id = v_template_id;

  -- quran_paras needs the *new* edition_id, not the template's:
  insert into quran_paras (tenant_id, edition_id, para_number, name_arabic, file_provider, file_reference, sort_order)
    select p_new_tenant_id, new_ed.id, p.para_number, p.name_arabic, p.file_provider, p.file_reference, p.sort_order
    from quran_paras p
    join quran_editions old_ed on old_ed.id = p.edition_id and old_ed.tenant_id = v_template_id
    join quran_editions new_ed on new_ed.tenant_id = p_new_tenant_id and new_ed.name = old_ed.name;

  insert into divine_names (tenant_id, category, order_index, arabic, transliteration, meaning_en, meaning_extra)
    select p_new_tenant_id, category, order_index, arabic, transliteration, meaning_en, meaning_extra
    from divine_names where tenant_id = v_template_id;

  -- ... repeated the same way for: qaida_courses, dua_categories → duas,
  -- hadith_collections → hadiths, books, pillars → pillar_details,
  -- prayers, ritual_guides → ritual_guide_steps, qa_items,
  -- site_pages, contact_channels, home_menu_items
end;
$$;
```

4. **Tables with a parent/child relationship** (Quran editions→paras, dua categories→duas, hadith collections→hadiths, pillars→details, ritual guides→steps) are seeded **parent first**, then children are re-linked by matching on a natural key (e.g. edition `name`, category `slug`) rather than copying the template's old UUIDs — this is the one piece of real care needed in the seeding function.
5. The whole seed runs in **one transaction** — if any table fails to copy, the entire tenant provisioning rolls back rather than leaving a half-seeded, broken app.
6. Result: the moment provisioning finishes, the new tenant has a **fully working app** — all 99+99 names, 40 hadiths, all duas, pillars, prayers, Q&A, contact placeholder, and a default home menu — ready to be customized/edited through the admin panel from day one, with zero manual data entry required.

### 4.3 Ongoing relationship between template and live tenants

- After seeding, a tenant's content is **fully independent** — editing tenant A's hadith text never affects tenant B or the template.
- Optional future capability (not built now, just noting it's naturally supported by this schema): a "reset this section to defaults" admin action, which is just a delete-then-reseed of one content table for one tenant, using the same copy logic scoped to a single table.

---

## Open Questions for You

1. **`home_menu_items` (toggle/reorder dashboard cards per tenant)** — include now, or hardcode the menu for v1 and add this later?
2. **`site_pages.content_blocks` as JSONB** for About/Home-hero — fine, or would you prefer fully normalized tables (e.g. `about_paragraphs`, `about_offerings`) even though that content is fairly free-form?
3. Do you want an **audit log table** (`content_audit_log`: who changed what, when) for the admin panel from day one, or is that a later addition?
4. Should **`books`** support a full in-app reader later (e.g. paginated text content), or will it always just be a title/author/tag card linking out to a PDF/URL like the current unwired buttons imply?

Let me know your calls on these + general sign-off, and we'll move to implementation planning next.
