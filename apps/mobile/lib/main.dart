import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'src/features/auth/auth_screens.dart';
import 'src/features/home/home_screen.dart';
import 'src/theme/app_theme.dart';

void main() {
  runApp(const ProviderScope(child: AiLawyerApp()));
}

final _router = GoRouter(
  routes: [
    GoRoute(path: '/', builder: (_, __) => const HomeScreen()),
    GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
    GoRoute(path: '/otp', builder: (_, __) => const OtpScreen()),
    GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
  ],
);

class AiLawyerApp extends StatelessWidget {
  const AiLawyerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'AI Юрист',
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: ThemeMode.system,
      routerConfig: _router,
      debugShowCheckedModeBanner: false,
    );
  }
}
