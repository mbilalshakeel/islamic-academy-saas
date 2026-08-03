-- ═══════════════════════════════════════════════════════════
-- 028_home_menu_items_nav_section.sql
-- Extends home_menu_items with a 'nav' section (module_keys:
-- nav_home, nav_qa, nav_about, nav_contact) so the public app's
-- top/bottom navigation can be toggled/relabeled/reordered through
-- the SAME Home Menu Config mechanism already built — per the
-- explicit earlier requirement that this is the single "no code
-- changes needed" customization surface, rather than inventing a
-- second table for nav-specific config.
-- ═══════════════════════════════════════════════════════════

alter table home_menu_items drop constraint home_menu_items_section_check;
alter table home_menu_items add constraint home_menu_items_section_check
  check (section in ('reading', 'learning', 'nav'));

alter table home_menu_items drop constraint home_menu_items_module_key_check;
alter table home_menu_items add constraint home_menu_items_module_key_check
  check (module_key in (
    'quran_16line','quran_15line','qaida','daily_duas',
    'allah_names','prophet_names','hadith','pillars',
    'islamic_knowledge','prayers','books',
    'sehri_iftar','dhikr_counter','hijri_calendar','zakat_calculator',
    'nav_home','nav_qa','nav_about','nav_contact'
  ));

do $$
declare
  v_tenant record;
  v_nav_modules text[] := array['nav_home','nav_qa','nav_about','nav_contact'];
  v_labels jsonb := '{
    "nav_home": "Home",
    "nav_qa": "Q&A",
    "nav_about": "About",
    "nav_contact": "Contact"
  }'::jsonb;
  v_key text;
  v_sort int;
begin
  for v_tenant in select id from tenants loop
    v_sort := 0;
    foreach v_key in array v_nav_modules loop
      v_sort := v_sort + 1;
      if not exists (
        select 1 from home_menu_items
        where tenant_id = v_tenant.id and module_key = v_key
      ) then
        insert into home_menu_items (tenant_id, module_key, section, custom_label, is_enabled, sort_order)
        values (v_tenant.id, v_key, 'nav', v_labels ->> v_key, true, v_sort);
      end if;
    end loop;
  end loop;
end $$;
