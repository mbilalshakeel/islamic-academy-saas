-- ═══════════════════════════════════════════════════════════
-- 022_new_islamic_tools_modules.sql
-- Stage 2: tenant_settings, dhikr_items, calendar_events.
--
-- Sehri/Iftar timings are deliberately NOT a table here — per the
-- requirements, they're fetched live from the Aladhan API at request
-- time (using tenant_settings' location), with a 24h cache. That cache
-- lives in a small table below (aladhan_prayer_time_cache) since it's
-- genuinely OUR data (a cache we own the lifecycle of), not content an
-- admin manages — no CRUD screen for it, just TTL-based reads/writes
-- from the API route.
--
-- Zakat Calculator is pure computation in the app layer (given
-- tenant_settings' gold/silver prices) — no table at all, as specified.
-- ═══════════════════════════════════════════════════════════

-- ── tenant_settings (1:1 with tenant) ──
create table tenant_settings (
  id                      uuid primary key default gen_random_uuid(),
  tenant_id               uuid not null unique references tenants(id) on delete cascade,
  city                    text,
  country                 text,
  latitude                numeric(9,6),
  longitude               numeric(9,6),
  calculation_method      int not null default 2, -- Aladhan method id; 2 = ISNA, a common reasonable default
  currency                text not null default 'USD',
  gold_price_per_gram     numeric(12,2),
  silver_price_per_gram   numeric(12,2),
  zakat_nisab_override    numeric(14,2),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

comment on column tenant_settings.calculation_method is
  'Aladhan API calculation method id (e.g. 2=ISNA, 3=MWL, 4=Umm al-Qura, 5=Egyptian). Used when fetching Sehri/Iftar timings.';
comment on column tenant_settings.gold_price_per_gram is
  'Admin-editable, in tenant_settings.currency. Used to derive the gold-based Zakat Nisab threshold (85g gold). NULL means the app falls back to a commonly-cited approximate default, clearly labeled as an estimate.';
comment on column tenant_settings.silver_price_per_gram is
  'Same as gold_price_per_gram but for the silver-based Nisab threshold (595g silver) — the lower of the two thresholds is the one traditionally used for Zakat.';
comment on column tenant_settings.zakat_nisab_override is
  'Optional: if set, used directly as the Nisab threshold instead of deriving it from gold/silver prices (e.g. if a tenant''s scholars publish a specific fatwa value).';

select apply_tenant_rls('tenant_settings');


-- ── dhikr_items ──
create table dhikr_items (
  id                      uuid primary key default gen_random_uuid(),
  tenant_id               uuid not null references tenants(id) on delete cascade,
  arabic_text             text not null,
  transliteration         text not null,
  translation             text not null,
  default_target_count    int not null default 33,
  category                text not null default 'tasbih'
                            check (category in ('tasbih','istighfar','durood','custom')),
  sort_order              int not null default 0,
  is_active               boolean not null default true,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

comment on table dhikr_items is
  'Admin-managed catalog of dhikr phrases for the public Tasbih/Dhikr Counter tool. The actual tally/counting happens client-side in the browser (localStorage), no login required — this table only defines WHICH phrases are available and their suggested target count.';

create index idx_dhikr_items_tenant on dhikr_items (tenant_id, category, sort_order);

select apply_tenant_rls('dhikr_items');


-- ── calendar_events ──
create table calendar_events (
  id                      uuid primary key default gen_random_uuid(),
  tenant_id               uuid not null references tenants(id) on delete cascade,
  hijri_month             int not null check (hijri_month between 1 and 12),
  hijri_day               int not null check (hijri_day between 1 and 30),
  title                   text not null,
  description             text,
  is_recurring_yearly     boolean not null default true,
  sort_order              int not null default 0,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

comment on table calendar_events is
  'Islamic/Hijri calendar events (Ramadan start, Eid, Ashura, etc). Stored by Hijri month/day rather than a fixed Gregorian date since these dates shift ~11 days earlier each Gregorian year — the app converts Hijri->Gregorian at render time for "today/upcoming" display using moment-hijri.';

create index idx_calendar_events_tenant on calendar_events (tenant_id, hijri_month, hijri_day);

select apply_tenant_rls('calendar_events');


-- ── aladhan_prayer_time_cache ──
-- Internal cache table, not an admin-managed content type. One row per
-- (tenant, Gregorian date), storing that day's Aladhan API response,
-- expiring after 24h. No RLS write access needed beyond the standard
-- tenant policies (the API route itself still runs as the calling
-- tenant's own session, same anon-key pattern as everything else).
create table aladhan_prayer_time_cache (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  date            date not null,
  fajr            text,
  maghrib         text,
  raw_response    jsonb,
  fetched_at      timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (tenant_id, date)
);

create index idx_aladhan_cache_tenant_date on aladhan_prayer_time_cache (tenant_id, date);

select apply_tenant_rls('aladhan_prayer_time_cache');
