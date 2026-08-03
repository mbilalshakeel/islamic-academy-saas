-- ═══════════════════════════════════════════════════════════
-- 027_home_menu_items_stage2_tools.sql
-- Extends home_menu_items.module_key to include the 4 new Stage 2
-- tools (Sehri/Iftar, Dhikr Counter, Hijri Calendar, Zakat Calculator)
-- as toggleable/reorderable home-screen modules, alongside the
-- original content modules. Backfills these into every existing
-- tenant (including the template) so nothing is silently missing
-- from tenants provisioned before this migration existed.
-- ═══════════════════════════════════════════════════════════

alter table home_menu_items drop constraint home_menu_items_module_key_check;
alter table home_menu_items add constraint home_menu_items_module_key_check
  check (module_key in (
    'quran_16line','quran_15line','qaida','daily_duas',
    'allah_names','prophet_names','hadith','pillars',
    'islamic_knowledge','prayers','books',
    'sehri_iftar','dhikr_counter','hijri_calendar','zakat_calculator'
  ));

do $$
declare
  v_tenant record;
  v_new_modules text[] := array['sehri_iftar','dhikr_counter','hijri_calendar','zakat_calculator'];
  v_labels jsonb := '{
    "sehri_iftar": "Sehri & Iftar Timings",
    "dhikr_counter": "Dhikr Counter",
    "hijri_calendar": "Hijri Calendar",
    "zakat_calculator": "Zakat Calculator"
  }'::jsonb;
  v_key text;
  v_next_sort int;
begin
  for v_tenant in select id from tenants loop
    select coalesce(max(sort_order), 0) into v_next_sort
      from home_menu_items where tenant_id = v_tenant.id and section = 'learning';

    foreach v_key in array v_new_modules loop
      if not exists (
        select 1 from home_menu_items
        where tenant_id = v_tenant.id and module_key = v_key
      ) then
        v_next_sort := v_next_sort + 1;
        insert into home_menu_items (tenant_id, module_key, section, custom_label, is_enabled, sort_order)
        values (v_tenant.id, v_key, 'learning', v_labels ->> v_key, true, v_next_sort);
      end if;
    end loop;
  end loop;
end $$;
