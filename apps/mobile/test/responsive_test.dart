import 'package:ai_lawyer_kz/main.dart';
import 'package:ai_lawyer_kz/src/features/auth/auth_screens.dart';
import 'package:ai_lawyer_kz/src/features/cases/case_screens.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('main screens fit small, wide and accessible text layouts',
      (tester) async {
    AuthRuntime.userId = '';
    MobileCaseRuntime.startDraft();
    tester.view.devicePixelRatio = 1;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });
    for (final width in [320.0, 360.0, 390.0, 430.0, 768.0, 1024.0]) {
      for (final scale in [1.0, 1.3, 2.0]) {
        for (final route in [
          '/',
          '/login',
          '/documents',
          '/cases',
          '/workflow/pretrial-claim/draft'
        ]) {
          tester.view.physicalSize = Size(width, width > 700 ? 600 : 740);
          await tester.pumpWidget(const SizedBox.shrink());
          await tester.pumpWidget(AiLawyerApp(
              initialLocation: route, textScaler: TextScaler.linear(scale)));
          await tester.pumpAndSettle();
          expect(tester.takeException(), isNull,
              reason: '$route width=$width scale=$scale');
        }
      }
    }
  });
}
