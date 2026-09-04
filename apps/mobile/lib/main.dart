import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'src/features/auth/auth_screens.dart';
import 'src/features/cases/case_screens.dart';
import 'src/features/documents/document_screens.dart';
import 'src/features/home/home_screen.dart';
import 'src/features/legal/legal_screens.dart';
import 'src/features/subscription/subscription_screen.dart';
import 'src/features/workflows/workflow_screens.dart';
import 'src/theme/app_theme.dart';

void main() {
  runApp(const ProviderScope(child: AiLawyerApp()));
}

GoRouter _buildRouter(String initialLocation) => GoRouter(
      initialLocation: initialLocation,
      routes: [
        GoRoute(
            path: '/onboarding', builder: (_, __) => const OnboardingScreen()),
        GoRoute(path: '/', builder: (_, __) => const HomeScreen()),
        GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
        GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
        GoRoute(path: '/otp', builder: (_, __) => const OtpScreen()),
        GoRoute(
            path: '/biometric', builder: (_, __) => const BiometricScreen()),
        GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
        GoRoute(path: '/settings', builder: (_, __) => const SettingsScreen()),
        GoRoute(path: '/help', builder: (_, __) => const HelpScreen()),
        GoRoute(path: '/cases', builder: (_, __) => const CasesListScreen()),
        GoRoute(
            path: '/case/details',
            builder: (_, __) => const CaseDetailsScreen()),
        GoRoute(path: '/case/new', builder: (_, __) => const NewCaseScreen()),
        GoRoute(
            path: '/case/category', builder: (_, __) => const CategoryScreen()),
        GoRoute(path: '/case/chat', builder: (_, __) => const CaseChatScreen()),
        GoRoute(
            path: '/documents', builder: (_, __) => const DocumentsScreen()),
        GoRoute(
            path: '/documents/analysis',
            builder: (_, __) => const DocumentAnalysisScreen()),
        GoRoute(
            path: '/deadlines', builder: (_, __) => const DeadlinesScreen()),
        GoRoute(path: '/legal', builder: (_, __) => const LegalSourcesScreen()),
        GoRoute(
            path: '/workflow/pretrial-claim',
            builder: (_, __) => const PretrialClaimScreen()),
        GoRoute(
            path: '/workflow/pretrial-claim/draft',
            builder: (_, __) => const ClaimDraftScreen()),
        GoRoute(
            path: '/workflow/pretrial-claim/send',
            builder: (_, __) => const ClaimSendScreen()),
        GoRoute(
            path: '/subscription',
            builder: (_, __) => const SubscriptionScreen()),
      ],
    );

class AiLawyerApp extends StatelessWidget {
  const AiLawyerApp({
    super.key,
    this.themeMode = ThemeMode.system,
    this.initialLocation = '/',
  });

  final ThemeMode themeMode;
  final String initialLocation;

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'AI Юрист',
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: themeMode,
      routerConfig: _buildRouter(initialLocation),
      debugShowCheckedModeBanner: false,
    );
  }
}
