-- ═══════════════════════════════════════════════════════════
-- 007_hadith_and_books.sql
-- 40 Hadiths (extensible to more collections) + Islamic Books
-- catalogue (title/author/cover card; no in-app reader in v1).
-- ═══════════════════════════════════════════════════════════

create table hadith_collections (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  name        text not null,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_hadith_collections_tenant on hadith_collections (tenant_id, sort_order);

select apply_tenant_rls('hadith_collections');


create table hadiths (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  collection_id   uuid not null references hadith_collections(id) on delete cascade,
  hadith_number   int not null,
  text_en         text not null,
  text_arabic     text,
  narrator        text,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (collection_id, hadith_number)
);

create index idx_hadiths_tenant on hadiths (tenant_id, collection_id, sort_order);

select apply_tenant_rls('hadiths');


create table books (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  title           text not null,
  author          text,
  description     text,
  category        text not null default 'other'
                    check (category in ('hadith','seerah','tafsir','fiqh','other')),
  language_tags   text[] not null default '{}',
  cover_icon      text,
  cover_gradient  text,
  file_provider   text not null default 'none'
                    check (file_provider in ('google_drive','url','none')),
  file_reference  text,
  sort_order      int not null default 0,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_books_tenant on books (tenant_id, sort_order);

select apply_tenant_rls('books');
