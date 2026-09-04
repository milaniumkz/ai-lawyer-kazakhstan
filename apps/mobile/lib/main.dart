import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'src/features/auth/auth_screens.dart';
import 'src/features/cases/case_screens.dart';
import 'src/features/documents/document_screens.dart';
import 'src/features/home/home_screen.dart';
import 'src/features/legal/legal_screens.dart';
import 'src/features/workflows/workflow_screens.dart';
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
    GoRoute(path: '/case/new', builder: (_, __) => const NewCaseScreen()),
    GoRoute(path: '/case/chat', builder: (_, __) => const CaseChatScreen()),
    GoRoute(path: '/documents', builder: (_, __) => const DocumentsScreen()),
    GoRoute(path: '/legal', builder: (_, __) => const LegalSourcesScreen()),
    GoRoute(
        path: '/workflow/pretrial-claim',
        builder: (_, __) => const PretrialClaimScreen()),
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
