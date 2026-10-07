import 'package:ai_lawyer_kz/main.dart';
import 'package:ai_lawyer_kz/src/features/auth/auth_screens.dart';
import 'package:ai_lawyer_kz/src/features/cases/case_screens.dart';
import 'package:ai_lawyer_kz/src/features/documents/document_screens.dart';
import 'package:ai_lawyer_kz/src/features/home/home_screen.dart';
import 'package:ai_lawyer_kz/src/features/legal/legal_screens.dart';
import 'package:ai_lawyer_kz/src/features/subscription/subscription_screen.dart';
import 'package:ai_lawyer_kz/src/features/workflows/workflow_screens.dart';
import 'package:ai_lawyer_kz/src/theme/app_theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  setUp(() {
    AuthRuntime.displayName = 'Тестовый пользователь';
  });

  testWidgets('home screen matches light design regression golden',
      (tester) async {
    await setReferenceViewport(tester);
    await tester.pumpWidget(const AiLawyerApp(
      themeMode: ThemeMode.light,
      initialLocation: '/',
    ));
    await tester.pumpAndSettle();

    await expectLater(
        find.byType(AiLawyerApp), matchesGoldenFile('goldens/home_light.png'));
  }, tags: ['golden']);

  testWidgets('home screen matches dark design regression golden',
      (tester) async {
    await setReferenceViewport(tester);
    await tester.pumpWidget(const AiLawyerApp(
      themeMode: ThemeMode.dark,
      initialLocation: '/',
    ));
    await tester.pumpAndSettle();

    await expectLater(
        find.byType(AiLawyerApp), matchesGoldenFile('goldens/home_dark.png'));
  }, tags: ['golden']);

  for (final entry in {
    '02_cases': '/cases',
    '03_documents': '/documents',
    '04_voice': '/case/new',
    '05_category': '/case/category',
    '06_analysis': '/documents/analysis',
    '07_upload': '/documents/add',
    '08_preview': '/workflow/pretrial-claim/draft',
    '09_send': '/workflow/pretrial-claim/send',
    '10_generation': '/workflow/pretrial-claim',
    '11_login': '/login',
  }.entries) {
    testWidgets('reference composition ${entry.key}', (tester) async {
      AuthRuntime.userId = '';
      MobileCaseRuntime.startDraft();
      tester.view.physicalSize = entry.key == '11_login'
          ? const Size(941, 1672)
          : const Size(852, 1846);
      tester.view.devicePixelRatio = tester.view.physicalSize.width / 390;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });
      await tester.pumpWidget(
          AiLawyerApp(themeMode: ThemeMode.dark, initialLocation: entry.value));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      await expectLater(find.byType(AiLawyerApp),
          matchesGoldenFile('goldens/aizan_${entry.key}.png'));
    }, tags: ['golden']);
  }

  testWidgets('core release screens render in light and dark themes',
      (tester) async {
    for (final theme in [AppTheme.light, AppTheme.dark]) {
      for (final screen in const [
        OnboardingScreen(),
        HomeScreen(),
        LoginScreen(),
        RegisterScreen(),
        OtpScreen(),
        BiometricScreen(),
        ProfileScreen(),
        SettingsScreen(),
        HelpScreen(),
        CasesListScreen(),
        CaseDetailsScreen(),
        NewCaseScreen(),
        CategoryScreen(),
        CaseChatScreen(),
        DocumentsScreen(),
        DocumentAnalysisScreen(),
        LegalSourcesScreen(),
        DeadlinesScreen(),
        PretrialClaimScreen(),
        ClaimDraftScreen(),
        ClaimSendScreen(),
        SubscriptionScreen(),
      ]) {
        await tester.pumpWidget(MaterialApp(theme: theme, home: screen));
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull);
      }
    }
  });
}

Future<void> setReferenceViewport(WidgetTester tester) async {
  tester.view.physicalSize = const Size(941, 1672);
  tester.view.devicePixelRatio = 941 / 390;
  addTearDown(() {
    tester.view.resetPhysicalSize();
    tester.view.resetDevicePixelRatio();
  });
}
