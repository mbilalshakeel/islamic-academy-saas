/// Mirrors `tenant_branding` table. Drives the whole app theme at runtime.
class TenantBranding {
  final String? appName;
  final String? shortName;
  final String? tagline;
  final String? description;
  final String? primaryColorHex;
  final String? secondaryColorHex;
  final String? backgroundColorHex;
  final String? textColorHex;
  final String? uiFont;
  final String? arabicFont;
  final String? urduFont;
  final bool darkModeDefault;
  final String? logoUrl;
  final String? faviconUrl;
  final String swCacheVersion;

  const TenantBranding({
    this.appName,
    this.shortName,
    this.tagline,
    this.description,
    this.primaryColorHex,
    this.secondaryColorHex,
    this.backgroundColorHex,
    this.textColorHex,
    this.uiFont,
    this.arabicFont,
    this.urduFont,
    this.darkModeDefault = false,
    this.logoUrl,
    this.faviconUrl,
    this.swCacheVersion = '1',
  });

  factory TenantBranding.fromJson(Map<String, dynamic> j) => TenantBranding(
        appName: j['app_name'] as String?,
        shortName: j['short_name'] as String?,
        tagline: j['tagline'] as String?,
        description: j['description'] as String?,
        primaryColorHex: j['primary_color_hex'] as String? ?? j['theme_color'] as String?,
        secondaryColorHex: j['secondary_color_hex'] as String?,
        backgroundColorHex: j['background_color'] as String?,
        textColorHex: j['text_color_hex'] as String?,
        uiFont: j['ui_font'] as String?,
        arabicFont: j['arabic_font'] as String?,
        urduFont: j['urdu_font'] as String?,
        darkModeDefault: j['dark_mode_default'] as bool? ?? false,
        logoUrl: j['logo_url'] as String?,
        faviconUrl: j['favicon_url'] as String?,
        swCacheVersion: j['sw_cache_version'] as String? ?? '1',
      );

  Map<String, dynamic> toJson() => {
        'app_name': appName,
        'short_name': shortName,
        'tagline': tagline,
        'description': description,
        'primary_color_hex': primaryColorHex,
        'secondary_color_hex': secondaryColorHex,
        'background_color_hex': backgroundColorHex,
        'text_color_hex': textColorHex,
        'ui_font': uiFont,
        'arabic_font': arabicFont,
        'urdu_font': urduFont,
        'dark_mode_default': darkModeDefault,
        'logo_url': logoUrl,
        'favicon_url': faviconUrl,
        'sw_cache_version': swCacheVersion,
      };
}
