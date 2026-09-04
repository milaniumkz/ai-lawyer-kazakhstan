import 'package:flutter/material.dart';

class AppColors {
  static const ivory = Color(0xFFFBF7EF);
  static const paper = Color(0xFFFFFFFF);
  static const graphite = Color(0xFF20272C);
  static const muted = Color(0xFF687078);
  static const gold = Color(0xFFD8A13A);
  static const goldDark = Color(0xFF9B6A16);
  static const navy = Color(0xFF071421);
  static const navyCard = Color(0xFF101D2A);
  static const success = Color(0xFF4CAF66);
  static const warning = Color(0xFFE5A43A);
  static const danger = Color(0xFFC94D4D);
}

class AppTheme {
  static ThemeData get light {
    final base = ThemeData(useMaterial3: true, brightness: Brightness.light);
    return base.copyWith(
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.gold,
        brightness: Brightness.light,
        primary: AppColors.goldDark,
        surface: AppColors.paper,
      ),
      scaffoldBackgroundColor: AppColors.ivory,
      textTheme: base.textTheme.apply(
        bodyColor: AppColors.graphite,
        displayColor: AppColors.graphite,
      ),
      cardTheme: const CardThemeData(
        color: AppColors.paper,
        elevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(20)),
          side: BorderSide(color: Color(0x33D8A13A)),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.gold,
          foregroundColor: AppColors.graphite,
          minimumSize: const Size(44, 52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
        ),
      ),
    );
  }

  static ThemeData get dark {
    final base = ThemeData(useMaterial3: true, brightness: Brightness.dark);
    return base.copyWith(
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.gold,
        brightness: Brightness.dark,
        primary: AppColors.gold,
        surface: AppColors.navyCard,
      ),
      scaffoldBackgroundColor: AppColors.navy,
      textTheme: base.textTheme.apply(
        bodyColor: Colors.white,
        displayColor: AppColors.gold,
      ),
      cardTheme: const CardThemeData(
        color: AppColors.navyCard,
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(20)),
          side: BorderSide(color: Color(0x66D8A13A)),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.gold,
          foregroundColor: AppColors.graphite,
          minimumSize: const Size(44, 52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
        ),
      ),
    );
  }
}
