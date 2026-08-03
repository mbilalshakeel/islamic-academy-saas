-- ═══════════════════════════════════════════════════════════
-- 013_seed_tenant_defaults_function.sql
-- The full tenant-provisioning seed routine. Copies every content
-- table from the reserved "template tenant" (tenants.is_template = true)
-- into a brand-new tenant, generating fresh primary keys and
-- rewriting tenant_id + parent-child foreign keys along the way.
--
-- SECURITY DEFINER: runs with the privileges of the function owner
-- (a role with RLS-bypass, e.g. a migrations/service role), NOT the
-- calling user — this is what allows it to read the template
-- tenant's rows (which normal RLS would otherwise hide from the
-- new tenant) and write rows tagged with a tenant_id that isn't
-- the caller's own session tenant.
--
-- Must be invoked only from trusted backend code (the tenant
-- provisioning service), never exposed directly to end users.
-- ═══════════════════════════════════════════════════════════

create or replace function seed_tenant_defaults(p_new_tenant_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_template_id uuid;
  v_old_edition_id uuid;
  v_new_edition_id uuid;
  v_old_cat_id uuid;
  v_new_cat_id uuid;
  v_old_collection_id uuid;
  v_new_collection_id uuid;
  v_old_pillar_id uuid;
  v_new_pillar_id uuid;
  v_old_guide_id uuid;
  v_new_guide_id uuid;
  rec record;
begin
  select id into v_template_id from tenants where is_template = true limit 1;

  if v_template_id is null then
    raise exception 'No template tenant found (tenants.is_template = true). Cannot seed defaults.';
  end if;

  if v_template_id = p_new_tenant_id then
    raise exception 'Refusing to seed the template tenant from itself.';
  end if;

  -- Ensure this function only ever runs once per new tenant (idempotency guard).
  if exists (select 1 from quran_editions where tenant_id = p_new_tenant_id)
     or exists (select 1 from divine_names where tenant_id = p_new_tenant_id)
     or exists (select 1 from hadiths where tenant_id = p_new_tenant_id) then
    raise exception 'Tenant % already has content. Refusing to reseed (use a per-table reset instead).', p_new_tenant_id;
  end if;

  -- ── tenant_branding (1:1) ─────────────────────────────
  insert into tenant_branding (tenant_id, app_name, short_name, tagline, description,
                                theme_color, background_color, primary_color_hex, secondary_color_hex,
                                favicon_url, logo_url, sw_cache_version)
    select p_new_tenant_id, app_name, short_name, tagline, description,
           theme_color, background_color, primary_color_hex, secondary_color_hex,
           favicon_url, logo_url, '1'
    from tenant_branding where tenant_id = v_template_id;

  -- ── tenant_pwa_icons ──────────────────────────────────
  insert into tenant_pwa_icons (tenant_id, size, url, purpose)
    select p_new_tenant_id, size, url, purpose
    from tenant_pwa_icons where tenant_id = v_template_id;

  -- ── quran_editions -> quran_paras (parent first, re-link by edition name) ──
  for rec in select * from quran_editions where tenant_id = v_template_id order by sort_order loop
    insert into quran_editions (tenant_id, name, line_count, sort_order, is_active)
      values (p_new_tenant_id, rec.name, rec.line_count, rec.sort_order, rec.is_active)
      returning id into v_new_edition_id;

    insert into quran_paras (tenant_id, edition_id, para_number, name_arabic, file_provider, file_reference, sort_order)
      select p_new_tenant_id, v_new_edition_id, para_number, name_arabic, file_provider, file_reference, sort_order
      from quran_paras
      where edition_id = rec.id and tenant_id = v_template_id;
  end loop;

  -- ── qaida_courses ─────────────────────────────────────
  insert into qaida_courses (tenant_id, name, level_label, color_theme, file_provider, file_reference, sort_order, is_active)
    select p_new_tenant_id, name, level_label, color_theme, file_provider, file_reference, sort_order, is_active
    from qaida_courses where tenant_id = v_template_id;

  -- ── divine_names (Allah's 99 + Prophet's names) ──────
  insert into divine_names (tenant_id, category, order_index, arabic, transliteration, meaning_en, meaning_urdu, meaning_extra)
    select p_new_tenant_id, category, order_index, arabic, transliteration, meaning_en, meaning_urdu, meaning_extra
    from divine_names where tenant_id = v_template_id;

  -- ── dua_categories -> duas (parent first, re-link by category slug) ──
  for rec in select * from dua_categories where tenant_id = v_template_id order by sort_order loop
    insert into dua_categories (tenant_id, slug, title, subtitle, icon, display_type, sort_order)
      values (p_new_tenant_id, rec.slug, rec.title, rec.subtitle, rec.icon, rec.display_type, rec.sort_order)
      returning id into v_new_cat_id;

    insert into duas (tenant_id, category_id, title, subtitle, arabic_text, translation_en, icon, numbered_position, sort_order)
      select p_new_tenant_id, v_new_cat_id, title, subtitle, arabic_text, translation_en, icon, numbered_position, sort_order
      from duas
      where category_id = rec.id and tenant_id = v_template_id;
  end loop;

  -- ── hadith_collections -> hadiths (parent first, re-link by collection name) ──
  for rec in select * from hadith_collections where tenant_id = v_template_id order by sort_order loop
    insert into hadith_collections (tenant_id, name, sort_order)
      values (p_new_tenant_id, rec.name, rec.sort_order)
      returning id into v_new_collection_id;

    insert into hadiths (tenant_id, collection_id, hadith_number, text_en, text_arabic, narrator, sort_order)
      select p_new_tenant_id, v_new_collection_id, hadith_number, text_en, text_arabic, narrator, sort_order
      from hadiths
      where collection_id = rec.id and tenant_id = v_template_id;
  end loop;

  -- ── books ─────────────────────────────────────────────
  insert into books (tenant_id, title, author, description, category, language_tags,
                      cover_icon, cover_gradient, file_provider, file_reference, sort_order, is_active)
    select p_new_tenant_id, title, author, description, category, language_tags,
           cover_icon, cover_gradient, file_provider, file_reference, sort_order, is_active
    from books where tenant_id = v_template_id;

  -- ── pillars -> pillar_details / pillar_guide_steps (parent first, re-link by slug) ──
  for rec in select * from pillars where tenant_id = v_template_id order by sort_order loop
    insert into pillars (tenant_id, slug, title, arabic_text, description, importance, sort_order)
      values (p_new_tenant_id, rec.slug, rec.title, rec.arabic_text, rec.description, rec.importance, rec.sort_order)
      returning id into v_new_pillar_id;

    insert into pillar_details (tenant_id, pillar_id, detail_text, sort_order)
      select p_new_tenant_id, v_new_pillar_id, detail_text, sort_order
      from pillar_details
      where pillar_id = rec.id and tenant_id = v_template_id;

    insert into pillar_guide_steps (tenant_id, pillar_id, title, description, sort_order)
      select p_new_tenant_id, v_new_pillar_id, title, description, sort_order
      from pillar_guide_steps
      where pillar_id = rec.id and tenant_id = v_template_id;
  end loop;

  -- ── prayers ───────────────────────────────────────────
  insert into prayers (tenant_id, name, time_label, rakat_fard, rakat_sunnah, rakat_nafl, rakat_witr, rakat_breakdown, sort_order)
    select p_new_tenant_id, name, time_label, rakat_fard, rakat_sunnah, rakat_nafl, rakat_witr, rakat_breakdown, sort_order
    from prayers where tenant_id = v_template_id;

  -- ── ritual_guides -> ritual_guide_steps (parent first, re-link by guide_type) ──
  for rec in select * from ritual_guides where tenant_id = v_template_id order by sort_order loop
    insert into ritual_guides (tenant_id, guide_type, title, intro_text, sort_order)
      values (p_new_tenant_id, rec.guide_type, rec.title, rec.intro_text, rec.sort_order)
      returning id into v_new_guide_id;

    insert into ritual_guide_steps (tenant_id, guide_id, step_number, title, description, arabic_text, icon, sort_order)
      select p_new_tenant_id, v_new_guide_id, step_number, title, description, arabic_text, icon, sort_order
      from ritual_guide_steps
      where guide_id = rec.id and tenant_id = v_template_id;
  end loop;

  -- ── qa_items ──────────────────────────────────────────
  insert into qa_items (tenant_id, category, question, answer, sort_order, is_active)
    select p_new_tenant_id, category, question, answer, sort_order, is_active
    from qa_items where tenant_id = v_template_id;

  -- ── site_pages ────────────────────────────────────────
  insert into site_pages (tenant_id, page_key, hero_title, hero_subtitle, content_blocks)
    select p_new_tenant_id, page_key, hero_title, hero_subtitle, content_blocks
    from site_pages where tenant_id = v_template_id;

  -- ── contact_channels ──────────────────────────────────
  insert into contact_channels (tenant_id, channel_type, label, value, icon, sort_order)
    select p_new_tenant_id, channel_type, label, value, icon, sort_order
    from contact_channels where tenant_id = v_template_id;

  -- ── home_menu_items ───────────────────────────────────
  insert into home_menu_items (tenant_id, module_key, section, custom_label, is_enabled, sort_order)
    select p_new_tenant_id, module_key, section, custom_label, is_enabled, sort_order
    from home_menu_items where tenant_id = v_template_id;

end;
$$;

comment on function seed_tenant_defaults(uuid) is
  'Copies all default content from the template tenant into a newly provisioned tenant. Must run inside a single transaction from trusted backend/provisioning code only (SECURITY DEFINER bypasses per-tenant RLS by design).';
