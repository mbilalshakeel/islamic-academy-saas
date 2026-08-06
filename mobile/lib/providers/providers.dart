import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/tenant_branding.dart';
import '../services/cache_service.dart';
import '../services/content_service.dart';
import '../services/theme_service.dart';

/// Holds current user preferences (language, font size, dark mode).
class PrefsState {
  final String language;
  final double fontSize;
  final bool darkMode;
  const PrefsState(this.language, this.fontSize, this.darkMode);

  PrefsState copyWith({String? language, double? fontSize, bool? darkMode}) =>
      PrefsState(language ?? this.language, fontSize ?? this.fontSize,
          darkMode ?? this.darkMode);
}

final prefsProvider = NotifierProvider<PrefsNotifier, PrefsState>(
  PrefsNotifier.new,
);

class PrefsNotifier extends Notifier<PrefsState> {
  @override
  PrefsState build() {
    final c = CacheService.instance;
    return PrefsState(c.language, c.fontSize, c.darkMode);
  }

  void setLanguage(String lang) {
    CacheService.instance.language = lang;
    state = state.copyWith(language: lang);
  }

  void setFontSize(double size) {
    CacheService.instance.fontSize = size;
    state = state.copyWith(fontSize: size);
  }

  void setDarkMode(bool v) {
    CacheService.instance.darkMode = v;
    state = state.copyWith(darkMode: v);
  }
}

/// Holds the live tenant branding once loaded.
final brandingProvider =
    StateProvider<TenantBranding?>((_) => null);

/// Derived: the effective ThemeData from branding + prefs.
final themeProvider = Provider<ThemeData>((ref) {
  final branding = ref.watch(brandingProvider);
  final prefs = ref.watch(prefsProvider);
  return ThemeService.build(branding, prefs.darkMode, prefs.fontSize);
});

/// Fired once at startup to load cache, then refresh from network.
final startupProvider = FutureProvider<void>((ref) async {
  final branding = await ContentService.instance.fetchBranding();
  ref.read(brandingProvider.notifier).state = branding;
  await ContentService.instance.checkForUpdates();
  final fresh = await ContentService.instance.fetchBranding(useCache: false);
  if (fresh != null) ref.read(brandingProvider.notifier).state = fresh;
});

final cachedContentReadyProvider = Provider<bool>((ref) {
  final cache = CacheService.instance;
  return cache.hasCache('divine_names') || cache.hasCache('hadiths');
});
