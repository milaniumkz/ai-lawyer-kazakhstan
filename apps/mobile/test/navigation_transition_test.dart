import 'package:ai_lawyer_kz/main.dart';
import 'package:ai_lawyer_kz/src/features/auth/auth_screens.dart';
import 'package:ai_lawyer_kz/src/features/cases/case_screens.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

void main() {
  testWidgets('iOS push and pop keep each moving page background opaque',
      (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });
    AuthRuntime.userId = '';
    MobileCaseRuntime.startDraft();
    await tester.pumpWidget(const AiLawyerApp(initialLocation: '/'));
    await tester.pumpAndSettle();
    final router = GoRouter.of(tester.element(find.byType(Scaffold).first));
    router.push<void>('/settings');
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));

    void expectOpaquePages() {
      for (final path in ['/', '/settings']) {
        final finder = find.byKey(ValueKey('aizan-route:$path'));
        expect(finder, findsOneWidget);
        final background =
            tester.widget<DecoratedBox>(finder).decoration as BoxDecoration;
        expect(background.gradient, isNotNull);
        expect(
            background.gradient!.colors.every((color) => color.a == 1), isTrue);
        expect(tester.getSize(finder), const Size(390, 844));
      }
      expect(tester.takeException(), isNull);
    }

    expectOpaquePages();
    await tester.pumpAndSettle();
    expect(find.byType(SettingsScreen), findsOneWidget);
    router.pop();
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));
    expectOpaquePages();
    await tester.pumpAndSettle();
    expect(find.byType(SettingsScreen), findsNothing);
  }, variant: TargetPlatformVariant.only(TargetPlatform.iOS));
}
