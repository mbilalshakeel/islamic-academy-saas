import 'dart:convert';
import 'package:hive_flutter/hive_flutter.dart';

/// Hive-backed local cache for offline support.
///
/// Stores: branding, all content collections, and user preferences.
/// All content is stored as JSON strings inside one box (`content`) so we
/// never depend on codegen — simple, robust, and easy to version.
class CacheService {
  CacheService._();
  static final CacheService instance = CacheService._();

  late Box _content;
  late Box _prefs;

  static const _contentBox = 'ici_content';
  static const _prefsBox = 'ici_prefs';

  Future<void> init() async {
    await Hive.initFlutter();
    _content = await Hive.openBox(_contentBox);
    _prefs = await Hive.openBox(_prefsBox);
  }

  // ── Content ─────────────────────────────────────────────
  void saveJson(String key, dynamic value) => _content.put(key, jsonEncode(value));
  dynamic readJson(String key) {
    final raw = _content.get(key);
    if (raw == null) return null;
    try {
      return jsonDecode(raw as String);
    } catch (_) {
      return null;
    }
  }

  String? readCacheVersion() => _content.get('sw_cache_version') as String?;
  void saveCacheVersion(String v) => _content.put('sw_cache_version', v);

  bool hasCache(String key) => _content.containsKey(key);
  void clearContent() => _content.clear();

  // ── Preferences ─────────────────────────────────────────
  String get language => _prefs.get('language', defaultValue: 'en') as String;
  set language(String v) => _prefs.put('language', v);

  double get fontSize => (_prefs.get('font_size', defaultValue: 16.0) as num).toDouble();
  set fontSize(double v) => _prefs.put('font_size', v);

  bool get darkMode => _prefs.get('dark_mode', defaultValue: false) as bool;
  set darkMode(bool v) => _prefs.put('dark_mode', v);

  int dhikrCount(String key) => (_prefs.get('dhikr_$key', defaultValue: 0) as num).toInt();
  void setDhikrCount(String key, int v) => _prefs.put('dhikr_$key', v);
}
