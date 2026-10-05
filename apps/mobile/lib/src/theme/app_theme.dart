import 'package:flutter/material.dart';

class AppColors {
  static const ivory = Color(0xFF0F0702);
  static const paper = Color(0xFF241507);
  static const graphite = Color(0xFFF6F1E9);
  static const muted = Color(0xFFB1A79B);
  static const gold = Color(0xFFE9B952);
  static const goldDark = Color(0xFFFFDF83);
  static const navy = Color(0xFF0F0702);
  static const navyCard = Color(0xFF241507);
  static const success = Color(0xFF4ED66A);
  static const warning = Color(0xFFE5A43A);
  static const danger = Color(0xFFC94D4D);
}

class AppTheme {
  // The October AIZAN reference defines one black/gold palette. Both system
  // appearances use it; the previous ivory/navy palettes are superseded.
  static ThemeData get light => _aizan;
  static ThemeData get dark => _aizan;

  static ThemeData get _aizan {
    final base = ThemeData(useMaterial3: true, brightness: Brightness.dark, fontFamily: 'AizanSans');
    return base.copyWith(
      colorScheme: const ColorScheme.dark(primary: AppColors.gold, onPrimary: Color(0xFF1C1103), surface: AppColors.paper, onSurface: AppColors.graphite),
      scaffoldBackgroundColor: Colors.transparent,
      canvasColor: AppColors.navy,
      textTheme: base.textTheme.copyWith(
        displayMedium: const TextStyle(fontFamily: 'AizanSerif', fontSize: 32, color: AppColors.goldDark),
        displaySmall: const TextStyle(fontFamily: 'AizanSerif', fontSize: 27, color: AppColors.goldDark),
        headlineMedium: const TextStyle(fontFamily: 'AizanSerif', fontSize: 28, color: AppColors.goldDark),
        headlineSmall: const TextStyle(fontFamily: 'AizanSerif', fontSize: 23, color: AppColors.goldDark),
      ),
      appBarTheme: const AppBarTheme(backgroundColor: Colors.transparent, foregroundColor: AppColors.goldDark, elevation: 0),
      cardTheme: const CardThemeData(color: Color(0xAA241507), elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(16)), side: BorderSide(color: Color(0x99BD872C)))),
      inputDecorationTheme: InputDecorationTheme(
        filled: true, fillColor: const Color(0x77170C03),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0x99BD872C))),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0x99BD872C))),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppColors.gold)),
        labelStyle: const TextStyle(color: AppColors.muted),
      ),
      filledButtonTheme: FilledButtonThemeData(style: FilledButton.styleFrom(
        backgroundColor: AppColors.gold, foregroundColor: const Color(0xFF1C1002), minimumSize: const Size(44, 48),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)))),
      outlinedButtonTheme: OutlinedButtonThemeData(style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.goldDark, minimumSize: const Size(44, 46), side: const BorderSide(color: AppColors.gold),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)))),
      dividerColor: const Color(0x55BD872C),
      iconTheme: const IconThemeData(color: AppColors.goldDark),
    );
  }
}
