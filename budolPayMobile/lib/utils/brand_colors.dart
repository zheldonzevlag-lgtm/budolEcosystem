import 'package:flutter/material.dart';

/// WHY: Centralized color tokens for the BudolPay Ruby & Charcoal branding.
/// WHAT: Defines both Light and Dark palettes as requested by the user,
/// supporting dynamic theme switching and high-contrast text inputs.
class BrandColors {
  // --- Primary Branding ---
  static const Color primary = Color(0xFFF43F5E); // Budol Red (Vibrant)
  static const Color primaryDark = Color(0xFF991B1B); // Deep Ruby
  static const Color accent = Color(0xFFF43F5E); // Budol Red Identity

  // --- Light Palette (Ruby Clean) ---
  static const Color lightSecondary = Color(0xFF0F172A); 
  static const Color lightSurface = Color(0xFFFFFFFF);   // Pure White
  static const Color lightText = Color(0xFF0F172A);      // Midnight
  static const Color lightBackground = Color(0xFFF8FAFC); // Slate White

  // --- Dark Palette (Ruby Stealth) ---
  static const Color darkSecondary = Color(0xFFF43F5E);  // Red
  static const Color darkSurface = Color(0xFF1E293B);    // Slate Blue
  static const Color darkText = Color(0xFFF1F5F9);      // Slate 100
  static const Color darkBackground = Color(0xFF0F172A); // Midnight

  // --- Utility Tokens ---
  static const Color textPrimary = Color(0xFF0F172A); 
  static Color get textSecondary => const Color(0xFF64748B); // Slate 500
  static Color get background => lightBackground; 
  static Color get surface => lightSurface;

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
        primary: primary,
        secondary: isDark ? darkSecondary : lightSecondary,
        surface: isDark ? darkSurface : lightSurface,
        onSurface: isDark ? darkText : lightText,
        onPrimary: Colors.white,
      ),
      // WHY: High-contrast professional inputs with premium focus state.
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: (isDark ? darkSurface : lightSurface),
        labelStyle: TextStyle(color: isDark ? darkText : lightText.withValues(alpha: 0.7)),
        hintStyle: TextStyle(color: (isDark ? darkText : lightText).withValues(alpha: 0.4)),
        prefixIconColor: primary,
        suffixIconColor: (isDark ? darkText : lightText).withValues(alpha: 0.5),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: isDark ? Colors.white12 : Colors.black12),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: isDark ? Colors.white12 : Colors.black12),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          // WHY: 2.5px width for professional prominence without bulk.
          borderSide: const BorderSide(color: primary, width: 2.5),
        ),
      ),
      textTheme: const TextTheme().apply(
        bodyColor: isDark ? darkText : lightText,
        displayColor: isDark ? darkText : lightText,
      ),
    );
  }
}
