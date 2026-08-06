/// White-label configuration.
///
/// Every brand-specific value is injected at BUILD TIME via `--dart-define`,
/// so one source tree produces unlimited uniquely-branded apps. To build a
/// new client:
///
///   flutter build apk \
///     --dart-define=TENANT_ID=... \
///     --dart-define=TENANT_SLUG=test-academy \
///     --dart-define=APP_NAME="Test Academy" \
///     --dart-define=APP_SHORT_NAME="TestAcademy" \
///     --dart-define=PRIMARY_COLOR=#0284C7 \
///     --dart-define=SECONDARY_COLOR=#0EA5E9 \
///     --dart-define=LOGO_ASSET=assets/images/logo_test_academy.png \
///     --dart-define=APP_PACKAGE=com.iciplatform.testacademy \
///     --dart-define=APP_BUNDLE=com.iciplatform.testacademy \
///     --dart-define=SUPABASE_URL=https://onybufoebaebfnwshagd.supabase.co \
///     --dart-define=SUPABASE_ANON_KEY=eyJ...
///
/// No secret API keys are compiled in — only the public anon key, exactly
/// like the web app. Tenant isolation is enforced by Supabase RLS.
library;

class AppConfig {
  /// Tenant this build is white-labeled for.
  final String tenantId;
  final String tenantSlug;

  /// Display identity.
  final String appName;
  final String appShortName;

  /// Branding (used as fallback before live theme is fetched from DB).
  final ColorSeed primaryColor;
  final ColorSeed secondaryColor;
  final String logoAsset;

  /// Package / bundle identifiers.
  final String appPackage;
  final String appBundle;

  /// Supabase connection (public anon key only).
  final String supabaseUrl;
  final String supabaseAnonKey;

  const AppConfig._({
    required this.tenantId,
    required this.tenantSlug,
    required this.appName,
    required this.appShortName,
    required this.primaryColor,
    required this.secondaryColor,
    required this.logoAsset,
    required this.appPackage,
    required this.appBundle,
    required this.supabaseUrl,
    required this.supabaseAnonKey,
  });

  static const String _tenantId = String.fromEnvironment('TENANT_ID', defaultValue: 'a94ddfee-879c-4367-ab79-f0d1b79160b5');
  static const String _tenantSlug = String.fromEnvironment('TENANT_SLUG', defaultValue: 'test-academy');
  static const String _appName = String.fromEnvironment('APP_NAME', defaultValue: 'Test Academy');
  static const String _appShortName = String.fromEnvironment('APP_SHORT_NAME', defaultValue: 'TestAcademy');
  static const String _primary = String.fromEnvironment('PRIMARY_COLOR', defaultValue: '#0284C7');
  static const String _secondary = String.fromEnvironment('SECONDARY_COLOR', defaultValue: '#0EA5E9');
  static const String _logo = String.fromEnvironment('LOGO_ASSET', defaultValue: 'assets/images/logo_default.png');
  static const String _package = String.fromEnvironment('APP_PACKAGE', defaultValue: 'com.iciplatform.app');
  static const String _bundle = String.fromEnvironment('APP_BUNDLE', defaultValue: 'com.iciplatform.app');
  static const String _url = String.fromEnvironment('SUPABASE_URL', defaultValue: 'https://onybufoebaebfnwshagd.supabase.co');
  static const String _anon = String.fromEnvironment('SUPABASE_ANON_KEY', defaultValue: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueWJ1Zm9lYmFlYmZud3NoYWdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MjE1MjgsImV4cCI6MjEwMTQ5NzUyOH0.37Za5QrdLxaCN02NOE1ZN_FTMSIML3LrVWwP5_w2cX8');

  static final AppConfig current = AppConfig._(
    tenantId: _tenantId,
    tenantSlug: _tenantSlug,
    appName: _appName,
    appShortName: _appShortName,
    primaryColor: ColorSeed.fromHex(_primary),
    secondaryColor: ColorSeed.fromHex(_secondary),
    logoAsset: _logo,
    appPackage: _package,
    appBundle: _bundle,
    supabaseUrl: _url,
    supabaseAnonKey: _anon,
  );
}

/// A simple hex-colour holder usable in `const` contexts.
class ColorSeed {
  final int value;
  const ColorSeed(this.value);

  static ColorSeed fromHex(String hex) {
    var h = hex.replaceFirst('#', '');
    if (h.length == 6) h = 'FF$h';
    final v = int.tryParse(h, radix: 16) ?? 0xFF0284C7;
    return ColorSeed(v);
  }
}
