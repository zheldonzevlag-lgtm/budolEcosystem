import 'package:flutter/material.dart';

/// WHY: Centralized color tokens for the BudolPay Ruby & Charcoal branding.
/// WHAT: Defines both Light and Dark palettes as requested by the user,
/// supporting dynamic theme switching and high-contrast text inputs.
class BrandColors {
  // --- Core Ruby Tokens ---
  static const Color primary = Color(0xFFF63049); // Vibrant Ruby
  static const Color primaryDark = Color(0xFFF7374F); // Darker Ruby (Deep)

  // --- Light Palette (Ruby & Navy) ---
  static const Color lightSecondary = Color(0xFFD02752); // Rose Berry
  static const Color lightSurface = Color(0xFF8A244B);   // Claret
  static const Color lightText = Color(0xFF111F35);      // Midnight Navy
  static const Color lightBackground = Color(0xFFFCF8F8); // Rose White

  // --- Dark Palette (Ruby & Charcoal) ---
  static const Color darkSecondary = Color(0xFF88304E);  // Wine
  static const Color darkSurface = Color(0xFF522546);    // Midnight Plum
  static const Color darkText = Colors.white;
  static const Color darkBackground = Color(0xFF2C2C2C); // Charcoal

  // --- Utility Tokens (Backwards Compatibility & Quick Access) ---
  static const Color textPrimary = Colors.white;
  static Color get textSecondary => Colors.white.withValues(alpha: 0.7);
  static Color get background => lightBackground; 
  static Color get surface => lightSurface;
  static Color get secondary => lightSecondary;

  /// Generates the BudolPay ThemeData for either brightness.
  static ThemeData getTheme(Brightness brightness) {
    final bool isDark = brightness == Brightness.dark;

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      primaryColor: isDark ? primaryDark : primary,
      scaffoldBackgroundColor: isDark ? darkBackground : lightBackground,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primary,
        brightness: brightness,
        primary: isDark ? primaryDark : primary,
        secondary: isDark ? darkSecondary : lightSecondary,
        surface: isDark ? darkSurface : lightSurface,
        onSurface: isDark ? darkText : lightText,
        onPrimary: Colors.white,
      ),
      // WHY: Ensures text inputs are always visible with high contrast.
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: (isDark ? darkSurface : Colors.white).withValues(alpha: 0.1),
        labelStyle: TextStyle(color: isDark ? darkText : lightText),
        hintStyle: TextStyle(color: (isDark ? darkText : lightText).withValues(alpha: 0.5)),
        prefixIconColor: isDark ? primaryDark : primary,
        suffixIconColor: isDark ? darkText.withValues(alpha: 0.5) : lightText.withValues(alpha: 0.5),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: isDark ? Colors.white24 : Colors.black12),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: isDark ? Colors.white24 : Colors.black12),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: isDark ? primaryDark : primary, width: 2),
        ),
      ),
      textTheme: const TextTheme().apply(
        bodyColor: isDark ? darkText : lightText,
        displayColor: isDark ? darkText : lightText,
      ),
    );
  }
}
