import 'dart:io';
import 'dart:ui' as ui;
import 'package:ai_lawyer_kz/main.dart';
import 'package:ai_lawyer_kz/src/api/draft_store.dart';
import 'package:ai_lawyer_kz/src/features/auth/auth_screens.dart';
import 'package:ai_lawyer_kz/src/features/cases/case_screens.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('all routes remain readable on small screens and large text',
      (tester) async {
    const routes = [
      '/onboarding',
      '/login',
      '/register',
      '/otp',
      '/biometric',
      '/',
      '/profile',
      '/settings',
      '/help',
      '/cases',
      '/case/details',
      '/case/new',
      '/case/category',
      '/case/chat',
      '/documents',
      '/documents/add',
      '/documents/analysis',
      '/deadlines',
      '/legal',
      '/workflow/pretrial-claim',
      '/workflow/pretrial-claim/draft',
      '/workflow/pretrial-claim/send',
      '/subscription'
    ];
    final failures = <String>[];
    tester.view.devicePixelRatio = 1;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });
    for (final scale in [1.0, 2.0]) {
      for (final route in routes) {
        AuthRuntime.userId = '';
        AuthRuntime.displayName = '';
        DraftStore.values = {};
        MobileCaseRuntime.startDraft();
        tester.view.physicalSize =
            Size(scale == 1 ? 390 : 320, scale == 1 ? 844 : 568);
        await tester.pumpWidget(const SizedBox.shrink());
        await tester.pumpWidget(RepaintBoundary(
            key: const ValueKey('capture'),
            child: AiLawyerApp(
                initialLocation: route, textScaler: TextScaler.linear(scale))));
        await tester.pumpAndSettle();
        Object? error;
        while ((error = tester.takeException()) != null) {
          failures.add('$route scale=$scale: $error');
        }
        final capture = Platform.environment['AIZAN_CAPTURE_DIR'];
        if (capture != null && scale == 1) {
          final context = tester.element(find.byType(AiLawyerApp));
          await tester.runAsync(() => Future.wait(tester
              .widgetList<Image>(find.byType(Image))
              .map((image) => precacheImage(image.image, context))));
          await tester.pumpAndSettle();
          final boundary = tester.renderObject<RenderRepaintBoundary>(
              find.byKey(const ValueKey('capture')));
          await tester.runAsync(() async {
            final image = await boundary.toImage();
            final bytes =
                await image.toByteData(format: ui.ImageByteFormat.png);
            await Directory(capture).create(recursive: true);
            await File(
                    '$capture/${route == '/' ? 'home' : route.substring(1).replaceAll('/', '_')}.png')
                .writeAsBytes(bytes!.buffer.asUint8List());
            image.dispose();
          });
          if (find.byType(Scrollable).evaluate().isNotEmpty) {
            await tester.drag(
                find.byType(Scrollable).first, const Offset(0, -4000));
            await tester.pumpAndSettle();
            await tester.runAsync(() async {
              final image = await boundary.toImage();
              final bytes =
                  await image.toByteData(format: ui.ImageByteFormat.png);
              await File(
                      '$capture/${route == '/' ? 'home' : route.substring(1).replaceAll('/', '_')}-bottom.png')
                  .writeAsBytes(bytes!.buffer.asUint8List());
              image.dispose();
            });
          }
        }
      }
    }
    expect(failures, isEmpty, reason: failures.join('\n'));
  });
}
