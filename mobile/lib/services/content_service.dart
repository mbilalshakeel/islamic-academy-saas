import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/content_models.dart';
import '../models/tenant_branding.dart';
import 'cache_service.dart';
import 'supabase_service.dart';

/// Fetches all tenant content from Supabase and caches it in Hive.
///
/// Startup strategy:
///  1. Read cache instantly (fast app open).
///  2. In background, compare `sw_cache_version`; if changed, refresh.
class ContentService {
  ContentService._();
  static final ContentService instance = ContentService._();

  SupabaseClient get _db => SupabaseService.instance.client;
  String get _tid => SupabaseService.instance.tenantId;

  // ── Branding ────────────────────────────────────────────
  Future<TenantBranding?> fetchBranding({bool useCache = true}) async {
    if (useCache && CacheService.instance.hasCache('branding')) {
      final cached = CacheService.instance.readJson('branding');
      if (cached != null) return TenantBranding.fromJson(cached);
    }
    try {
      final rows = await _db
          .from('tenant_branding')
          .select()
          .eq('tenant_id', _tid)
          .limit(1);
      if (rows.isNotEmpty) {
        final map = (rows.first as Map).cast<String, dynamic>();
        CacheService.instance.saveJson('branding', map);
        return TenantBranding.fromJson(map);
      }
    } catch (_) {}
    // Fall back to cache even if network failed
    final cached = CacheService.instance.readJson('branding');
    return cached == null ? null : TenantBranding.fromJson(cached);
  }

  // ── Generic collection fetch + cache ────────────────────
  Future<List<dynamic>> _fetchAndCache(
      String table, String cacheKey, String orderBy) async {
    final rows = await _db
        .from(table)
        .select()
        .eq('tenant_id', _tid)
        .order(orderBy);
    final list = rows.map((e) => (e as Map).cast<String, dynamic>()).toList();
    CacheService.instance.saveJson(cacheKey, list);
    return list;
  }

  List<dynamic> _cached(String cacheKey) =>
      CacheService.instance.readJson(cacheKey) as List<dynamic>? ?? [];

  /// Checks the DB `sw_cache_version` and refreshes content if it differs.
  /// Returns true if an update happened.
  Future<bool> checkForUpdates() async {
    try {
      final b = await fetchBranding(useCache: false);
      final newVer = b?.swCacheVersion ?? '1';
      final cachedVer = CacheService.instance.readCacheVersion();
      if (cachedVer != newVer) {
        await refreshAll();
        CacheService.instance.saveCacheVersion(newVer);
        return true;
      }
    } catch (_) {}
    return false;
  }

  Future<void> refreshAll() async {
    await Future.wait([
      _fetchAndCache('quran_editions', 'quran_editions', 'sort_order'),
      _fetchAndCache('quran_paras', 'quran_paras', 'para_number'),
      _fetchAndCache('qaida_courses', 'qaida_courses', 'sort_order'),
      _fetchAndCache('divine_names', 'divine_names', 'sort_order'),
      _fetchAndCache('duas', 'duas', 'sort_order'),
      _fetchAndCache('hadiths', 'hadiths', 'hadith_number'),
      _fetchAndCache('pillars', 'pillars', 'sort_order'),
      _fetchAndCache('prayers', 'prayers', 'sort_order'),
      _fetchAndCache('books', 'books', 'sort_order'),
      _fetchAndCache('qa_items', 'qa_items', 'sort_order'),
      _fetchAndCache('contact_channels', 'contact_channels', 'sort_order'),
      _fetchAndCache('dhikr_items', 'dhikr_items', 'sort_order'),
      _fetchAndCache('calendar_events', 'calendar_events', 'hijri_day'),
      _fetchAndCache('home_menu_items', 'home_menu_items', 'sort_order'),
      _fetchAndCache('site_pages', 'site_pages', 'page_key'),
    ]);
  }

  // ── Typed getters (cache-first) ─────────────────────────
  List<QuranEdition> get quranEditions =>
      _cached('quran_editions').map((e) => QuranEdition.fromJson(e)).toList();
  List<QuranPara> get quranParas =>
      _cached('quran_paras').map((e) => QuranPara.fromJson(e)).toList();
  List<QaidaCourse> get qaidaCourses =>
      _cached('qaida_courses').map((e) => QaidaCourse.fromJson(e)).toList();
  List<DivineName> get divineNames =>
      _cached('divine_names').map((e) => DivineName.fromJson(e)).toList();
  List<Dua> get duas =>
      _cached('duas').map((e) => Dua.fromJson(e)).toList();
  List<Hadith> get hadiths =>
      _cached('hadiths').map((e) => Hadith.fromJson(e)).toList();
  List<Pillar> get pillars =>
      _cached('pillars').map((e) => Pillar.fromJson(e)).toList();
  List<Prayer> get prayers =>
      _cached('prayers').map((e) => Prayer.fromJson(e)).toList();
  List<Book> get books =>
      _cached('books').map((e) => Book.fromJson(e)).toList();
  List<QaItem> get qaItems =>
      _cached('qa_items').map((e) => QaItem.fromJson(e)).toList();
  List<ContactChannel> get contactChannels =>
      _cached('contact_channels').map((e) => ContactChannel.fromJson(e)).toList();
  List<DhikrItem> get dhikrItems =>
      _cached('dhikr_items').map((e) => DhikrItem.fromJson(e)).toList();
  List<CalendarEvent> get calendarEvents =>
      _cached('calendar_events').map((e) => CalendarEvent.fromJson(e)).toList();
  List<HomeMenuItem> get homeMenuItems =>
      _cached('home_menu_items').map((e) => HomeMenuItem.fromJson(e)).toList();

  SitePage? sitePage(String pageKey) {
    final all = _cached('site_pages').map((e) => SitePage.fromJson(e)).toList();
    for (final p in all) {
      if (p.pageKey == pageKey) return p;
    }
    return null;
  }
}
