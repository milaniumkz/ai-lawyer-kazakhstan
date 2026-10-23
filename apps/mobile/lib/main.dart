import 'src/api/draft_store.dart';
import 'src/preview_config.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
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
import 'src/api/session_credentials.dart';
import 'src/widgets/aizan_design.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final saved = await SessionCredentials.restore();
  if (saved != null) {
    AuthRuntime.userId = saved['userId'] as String;
    AuthRuntime.profileComplete = saved['profileComplete'] == true;
    AuthRuntime.displayName = saved['displayName'] as String? ?? '';
    await DraftStore.restore(AuthRuntime.userId);
    MobileCaseRuntime.restore();
    WorkflowRuntime.restore();
  }
  const initialRoute = String.fromEnvironment(
    'AI_LAWYER_INITIAL_ROUTE',
    defaultValue: '/login',
  );
  final launchRoute = nativePreviewRoute(initialRoute);
  runApp(ProviderScope(
      child: AiLawyerApp(
          initialLocation: saved == null
              ? launchRoute
              : AuthRuntime.profileComplete
                  ? '/'
                  : '/profile')));
  if (nativePreviewEnabled) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      confirmNativePreviewRoute(launchRoute);
    });
  }
}

// Each route owns its background. A shared background outside Navigator leaves
// transparent Scaffolds showing the previous route during iOS push/pop slides.
GoRoute _aizanRoute(
        {required String path,
        required Widget Function(BuildContext, GoRouterState) builder}) =>
    GoRoute(
        path: path,
        builder: (context, state) => DecoratedBox(
            key: ValueKey('aizan-route:$path'),
            decoration: AizanDesign.background,
            child: builder(context, state)));

GoRouter _buildRouter(String initialLocation) => GoRouter(
      initialLocation: initialLocation,
      routes: [
        _aizanRoute(
            path: '/onboarding', builder: (_, __) => const OnboardingScreen()),
        _aizanRoute(path: '/', builder: (_, __) => const HomeScreen()),
        _aizanRoute(path: '/login', builder: (_, __) => const LoginScreen()),
        _aizanRoute(
            path: '/register', builder: (_, __) => const RegisterScreen()),
        _aizanRoute(path: '/otp', builder: (_, __) => const OtpScreen()),
        _aizanRoute(
            path: '/biometric', builder: (_, __) => const BiometricScreen()),
        _aizanRoute(
            path: '/profile', builder: (_, __) => const ProfileScreen()),
        _aizanRoute(
            path: '/settings', builder: (_, __) => const SettingsScreen()),
        _aizanRoute(path: '/help', builder: (_, __) => const HelpScreen()),
        _aizanRoute(
            path: '/cases', builder: (_, __) => const CasesListScreen()),
        _aizanRoute(
            path: '/case/details',
            builder: (_, __) => const CaseDetailsScreen()),
        _aizanRoute(
            path: '/case/new', builder: (_, __) => const NewCaseScreen()),
        _aizanRoute(
            path: '/case/category', builder: (_, __) => const CategoryScreen()),
        _aizanRoute(
            path: '/case/chat', builder: (_, __) => const CaseChatScreen()),
        _aizanRoute(
            path: '/documents', builder: (_, __) => const DocumentsScreen()),
        _aizanRoute(
            path: '/documents/add',
            builder: (_, state) => DocumentsScreen(
                addMode: true,
                openCamera: state.uri.queryParameters['source'] == 'camera')),
        _aizanRoute(
            path: '/documents/analysis',
            builder: (_, __) => const DocumentAnalysisScreen()),
        _aizanRoute(
            path: '/deadlines', builder: (_, __) => const DeadlinesScreen()),
        _aizanRoute(
            path: '/legal', builder: (_, __) => const LegalSourcesScreen()),
        _aizanRoute(
            path: '/workflow/pretrial-claim',
            builder: (_, __) => const PretrialClaimScreen()),
        _aizanRoute(
            path: '/workflow/pretrial-claim/draft',
            builder: (_, __) => const ClaimDraftScreen()),
        _aizanRoute(
            path: '/workflow/pretrial-claim/send',
            builder: (_, __) => const ClaimSendScreen()),
        _aizanRoute(
            path: '/subscription',
            builder: (_, __) => const SubscriptionScreen()),
      ],
    );

class AiLawyerApp extends StatelessWidget {
  const AiLawyerApp({
    super.key,
    this.themeMode = ThemeMode.system,
    this.initialLocation = '/login',
    this.textScaler,
  });

  final ThemeMode themeMode;
  final String initialLocation;
  final TextScaler? textScaler;

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Айзан',
      locale: const Locale('ru'),
      supportedLocales: const [Locale('ru'), Locale('kk'), Locale('en')],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: themeMode,
      routerConfig: _buildRouter(initialLocation),
      debugShowCheckedModeBanner: false,
      builder: (context, child) => DecoratedBox(
          decoration: AizanDesign.background,
          child: Center(
              child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 480),
                  child: textScaler == null
                      ? child
                      : MediaQuery(
                          data: MediaQuery.of(context)
                              .copyWith(textScaler: textScaler),
                          child: child!)))),
    );
  }
}
