import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../flavors/app_config.dart';
import '../models/tenant_branding.dart';

/// Builds a runtime [ThemeData] from the tenant's live branding fetched from
/// Supabase, respecting the web platform's design tokens (WCAG contrast,
/// Arabic/Urdu line-heights, light-mode-by-default with optional dark).
class ThemeService {
  /// Maps tenant `ui_font`/`arabic_font`/`urdu_font` names to Google Fonts.
  static TextStyle _ui(String? font, double size, Color color,
      {FontWeight weight = FontWeight.normal}) {
    switch (font) {
      case 'Inter':
        return GoogleFonts.inter(fontSize: size, color: color, fontWeight: weight);
      case 'Roboto':
        return GoogleFonts.roboto(fontSize: size, color: color, fontWeight: weight);
      case 'Poppins':
        return GoogleFonts.poppins(fontSize: size, color: color, fontWeight: weight);
      case 'Nunito':
        return GoogleFonts.nunito(fontSize: size, color: color, fontWeight: weight);
      default:
        return TextStyle(fontSize: size, color: color, fontWeight: weight);
    }
  }

  /// Arabic typography: larger size + line-height 2.1 (per web design system).
  static TextStyle arabic(TenantBranding? b, double size, Color color) {
    return GoogleFonts.amiri(
        fontSize: size + 4, color: color, height: 2.1, fontWeight: FontWeight.w600);
  }

  /// Urdu typography: line-height 2.0 (per web design system).
  static TextStyle urdu(TenantBranding? b, double size, Color color) {
    return GoogleFonts.notoNastaliqUrdu(
        fontSize: size + 4, color: color, height: 2.0);
  }

  /// Dynamic on-primary text colour with simple WCAG luminance contrast.
  static Color onColor(Color bg) {
    final r = (bg.red) / 255;
    final g = (bg.green) / 255;
    final b = (bg.blue) / 255;
    final lum = 0.299 * r + 0.587 * g + 0.114 * b;
    return lum > 0.6 ? Colors.black : Colors.white;
  }

  static Color _parse(String hex, Color fallback) {
    var h = hex.replaceFirst('#', '');
    if (h.length == 6) h = 'FF$h';
    final v = int.tryParse(h, radix: 16);
    return v == null ? fallback : Color(v);
  }

  static ThemeData build(TenantBranding? branding, bool darkMode, double fontSize) {
    final primary = _parse(branding?.primaryColorHex ?? '',
        Color(AppConfig.current.primaryColor.value));
    final secondary = _parse(branding?.secondaryColorHex ?? '',
        Color(AppConfig.current.secondaryColor.value));
    final textColor = darkMode
        ? Colors.white
        : _parse(branding?.textColorHex ?? '#0F172A', const Color(0xFF0F172A));
    final bg = darkMode
        ? const Color(0xFF121212)
        : _parse(branding?.backgroundColorHex ?? '#FFFFFF', Colors.white);
    final onPrimary = onColor(primary);

    final base = ThemeData(
      useMaterial3: true,
      brightness: darkMode ? Brightness.dark : Brightness.light,
      scaffoldBackgroundColor: bg,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primary,
        brightness: darkMode ? Brightness.dark : Brightness.light,
        primary: primary,
        secondary: secondary,
        surface: bg,
      ),
    );

    final uiFont = branding?.uiFont ?? 'Inter';
    return base.copyWith(
      textTheme: base.textTheme
          .apply(bodyColor: textColor, displayColor: textColor)
          .copyWith(
            bodyMedium: _ui(uiFont, fontSize, textColor),
            bodyLarge: _ui(uiFont, fontSize + 2, textColor),
            titleLarge: _ui(uiFont, fontSize + 8, textColor,
                weight: FontWeight.bold),
            titleMedium: _ui(uiFont, fontSize + 4, textColor,
                weight: FontWeight.w600),
          ),
      appBarTheme: AppBarTheme(
        backgroundColor: primary,
        foregroundColor: onPrimary,
        elevation: 0,
        titleTextStyle: TextStyle(color: onPrimary, fontSize: fontSize + 4,
            fontWeight: FontWeight.bold),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: onPrimary,
          textStyle: TextStyle(fontSize: fontSize),
        ),
      ),
    );
  }
}
