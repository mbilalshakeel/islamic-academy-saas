-- ═══════════════════════════════════════════════════════════
-- 024_seed_template_stage2_data.sql
-- Seeds the TEMPLATE TENANT with:
--   1. tenant_settings row (empty location — deliberately, per spec:
--      "if tenant_settings has no location set yet, show a clear
--      'Set your city in Settings' prompt" — the template itself
--      should demonstrate that default state, not fake a location).
--      Gold/silver prices are pre-filled with commonly-cited
--      approximate figures so the Zakat Calculator has a sensible
--      starting point out of the box, clearly labeled as an estimate
--      in the UI (not claimed to be real-time accurate).
--   2. 6 default dhikr items (SubhanAllah, Alhamdulillah, Allahu Akbar,
--      La ilaha illallah, Astaghfirullah, Durood Sharif).
--   3. A full year of standard Hijri calendar events.
-- ═══════════════════════════════════════════════════════════

do $$
declare
  v_tenant_id uuid := '00000000-0000-0000-0000-000000000001';
begin

  -- ── tenant_settings ──────────────────────────────────
  -- Approximate global gold/silver prices as of writing — an admin MUST
  -- update these periodically; the Zakat Calculator UI labels them as
  -- estimates, never as live/authoritative figures.
  insert into tenant_settings (tenant_id, currency, gold_price_per_gram, silver_price_per_gram)
    values (v_tenant_id, 'USD', 75.00, 0.95)
    on conflict (tenant_id) do nothing;

  -- ── Default Dhikr Items ──────────────────────────────
  insert into dhikr_items (tenant_id, arabic_text, transliteration, translation, default_target_count, category, sort_order) values
    (v_tenant_id, 'سُبْحَانَ اللهِ', 'SubhanAllah', 'Glory be to Allah', 33, 'tasbih', 1),
    (v_tenant_id, 'الْحَمْدُ لِلَّهِ', 'Alhamdulillah', 'All praise is due to Allah', 33, 'tasbih', 2),
    (v_tenant_id, 'اللهُ أَكْبَرُ', 'Allahu Akbar', 'Allah is the Greatest', 34, 'tasbih', 3),
    (v_tenant_id, 'لَا إِلَٰهَ إِلَّا اللهُ', 'La ilaha illallah', 'There is no god but Allah', 100, 'tasbih', 4),
    (v_tenant_id, 'أَسْتَغْفِرُ اللهَ', 'Astaghfirullah', 'I seek forgiveness from Allah', 100, 'istighfar', 5),
    (v_tenant_id, 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ', 'Durood Sharif', 'O Allah, send blessings upon Muhammad', 100, 'durood', 6);

  -- ── Full year of standard Hijri calendar events ──────
  insert into calendar_events (tenant_id, hijri_month, hijri_day, title, description, is_recurring_yearly, sort_order) values
    (v_tenant_id, 1, 1,  'Islamic New Year', 'Beginning of the Hijri year (1 Muharram).', true, 1),
    (v_tenant_id, 1, 10, 'Day of Ashura', 'A significant day of fasting and remembrance (10 Muharram).', true, 2),
    (v_tenant_id, 3, 12, 'Mawlid al-Nabi', 'Commemoration of the birth of Prophet Muhammad (peace be upon him), 12 Rabi al-Awwal.', true, 3),
    (v_tenant_id, 7, 27, 'Isra and Mi''raj', 'The Night Journey and Ascension of the Prophet (peace be upon him), 27 Rajab.', true, 4),
    (v_tenant_id, 8, 15, 'Shab-e-Barat', 'The Night of Forgiveness / Night of Records, 15 Sha''ban.', true, 5),
    (v_tenant_id, 9, 1,  'Start of Ramadan', 'Beginning of the blessed month of fasting.', true, 6),
    (v_tenant_id, 9, 27, 'Laylat al-Qadr (observed)', 'The Night of Decree, commonly observed on 27 Ramadan (may fall on any odd night in the last 10 days).', true, 7),
    (v_tenant_id, 10, 1, 'Eid al-Fitr', 'Festival marking the end of Ramadan, 1 Shawwal.', true, 8),
    (v_tenant_id, 12, 8, 'Hajj Begins', 'Start of the annual pilgrimage rites, 8 Dhul-Hijjah.', true, 9),
    (v_tenant_id, 12, 9, 'Day of Arafah', 'The most significant day of Hajj; fasting recommended for non-pilgrims, 9 Dhul-Hijjah.', true, 10),
    (v_tenant_id, 12, 10, 'Eid al-Adha', 'Festival of Sacrifice, 10 Dhul-Hijjah.', true, 11),
    (v_tenant_id, 12, 11, 'Eid al-Adha (Tashreeq, Day 2)', 'Second day of Eid al-Adha / Days of Tashreeq.', true, 12),
    (v_tenant_id, 12, 12, 'Eid al-Adha (Tashreeq, Day 3)', 'Third day of Eid al-Adha / Days of Tashreeq.', true, 13);

end $$;
