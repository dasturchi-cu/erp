import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

/// Centralized, professional Material 3 design system for the ERP mobile app.
/// Ensures high contrast, crystal-clear typography, and perfect readability
/// across both Light and Dark system modes.
class AppTheme {
  static const Color brandIndigo = Color(0xFF4F46E5);
  static const Color brandViolet = Color(0xFF7C3AED);
  static const Color success = Color(0xFF16A34A);
  static const Color warning = Color(0xFFF59E0B);
  static const Color danger = Color(0xFFDC2626);
  static const Color info = Color(0xFF0EA5E9);

  static const double radius = 16;
  static const double fieldRadius = 14;

  static ThemeData light() => _build(Brightness.light);
  static ThemeData dark() => _build(Brightness.dark);

  static ThemeData _build(Brightness brightness) {
    final isDark = brightness == Brightness.dark;
    
    // Explicit high-contrast text and surface colors
    final Color textColor = isDark ? const Color(0xFFF8FAFC) : const Color(0xFF0F172A);
    final Color textMutedColor = isDark ? const Color(0xFF94A3B8) : const Color(0xFF475569);
    final Color surfaceColor = isDark ? const Color(0xFF181B21) : Colors.white;
    final Color backgroundColor = isDark ? const Color(0xFF0F1115) : const Color(0xFFF8FAFC);
    final Color cardBorderColor = isDark ? const Color(0xFF2A2E37) : const Color(0xFFE2E8F0);
    final Color fieldFillColor = isDark ? const Color(0xFF1E222A) : const Color(0xFFF1F5F9);

    final scheme = ColorScheme.fromSeed(
      seedColor: brandIndigo,
      brightness: brightness,
      surface: surfaceColor,
      onSurface: textColor,
      onSurfaceVariant: textMutedColor,
    );

    final base = ThemeData(
      colorScheme: scheme,
      useMaterial3: true,
      brightness: brightness,
      scaffoldBackgroundColor: backgroundColor,
      splashFactory: InkSparkle.splashFactory,
    );

    final baseTextTheme = isDark ? ThemeData.dark().textTheme : ThemeData.light().textTheme;
    final textTheme = GoogleFonts.outfitTextTheme(baseTextTheme).copyWith(
      titleLarge: GoogleFonts.outfit(
        fontSize: 22,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.3,
        color: textColor,
      ),
      titleMedium: GoogleFonts.outfit(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: textColor,
      ),
      titleSmall: GoogleFonts.outfit(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: textColor,
      ),
      bodyLarge: GoogleFonts.outfit(
        fontSize: 15,
        fontWeight: FontWeight.w500,
        color: textColor,
      ),
      bodyMedium: GoogleFonts.outfit(
        fontSize: 14,
        height: 1.4,
        color: textColor,
      ),
      bodySmall: GoogleFonts.outfit(
        fontSize: 12,
        color: textMutedColor,
      ),
      labelLarge: GoogleFonts.outfit(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: textColor,
      ),
    );

    return base.copyWith(
      textTheme: textTheme,
      primaryColor: brandIndigo,
      appBarTheme: AppBarTheme(
        backgroundColor: surfaceColor,
        foregroundColor: textColor,
        elevation: 0,
        scrolledUnderElevation: 0.5,
        centerTitle: false,
        iconTheme: IconThemeData(color: textColor),
        actionsIconTheme: IconThemeData(color: textColor),
        titleTextStyle: GoogleFonts.outfit(
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: textColor,
          letterSpacing: -0.3,
        ),
        systemOverlayStyle: isDark ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark,
      ),
      cardTheme: CardThemeData(
        color: surfaceColor,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radius),
          side: BorderSide(color: cardBorderColor),
        ),
        clipBehavior: Clip.antiAlias,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: fieldFillColor,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(fieldRadius),
          borderSide: BorderSide(color: cardBorderColor),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(fieldRadius),
          borderSide: BorderSide(color: cardBorderColor),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(fieldRadius),
          borderSide: const BorderSide(color: brandIndigo, width: 1.8),
        ),
        labelStyle: GoogleFonts.outfit(fontSize: 14, color: textMutedColor, fontWeight: FontWeight.w500),
        floatingLabelStyle: GoogleFonts.outfit(fontSize: 14, color: brandIndigo, fontWeight: FontWeight.w600),
        hintStyle: GoogleFonts.outfit(fontSize: 14, color: textMutedColor.withValues(alpha: 0.8)),
        prefixIconColor: textMutedColor,
        suffixIconColor: textMutedColor,
      ),
      dropdownMenuTheme: DropdownMenuThemeData(
        textStyle: GoogleFonts.outfit(fontSize: 15, color: textColor, fontWeight: FontWeight.w500),
        menuStyle: MenuStyle(
          backgroundColor: WidgetStatePropertyAll(surfaceColor),
          surfaceTintColor: const WidgetStatePropertyAll(Colors.transparent),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: brandIndigo,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(fieldRadius)),
          textStyle: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w600),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(fieldRadius)),
          textStyle: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w600),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 18),
          side: BorderSide(color: cardBorderColor),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(fieldRadius)),
          textStyle: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w600, color: textColor),
        ),
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: brandIndigo,
        foregroundColor: Colors.white,
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(fieldRadius)),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: isDark ? const Color(0xFF1E222A) : const Color(0xFFEEF2F6),
        labelStyle: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w600, color: textColor),
        side: BorderSide(color: cardBorderColor),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
      dividerTheme: DividerThemeData(color: cardBorderColor, thickness: 1, space: 1),
      listTileTheme: ListTileThemeData(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        titleTextStyle: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w600, color: textColor),
        subtitleTextStyle: GoogleFonts.outfit(fontSize: 13, color: textMutedColor),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: surfaceColor,
        surfaceTintColor: Colors.transparent,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: surfaceColor,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        titleTextStyle: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: textColor),
        contentTextStyle: GoogleFonts.outfit(fontSize: 14, color: textColor),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        backgroundColor: isDark ? const Color(0xFF2A2E37) : const Color(0xFF1F2430),
        contentTextStyle: GoogleFonts.outfit(fontSize: 14, color: Colors.white),
      ),
    );
  }
}
