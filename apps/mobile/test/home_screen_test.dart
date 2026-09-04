import 'package:ai_lawyer_kz/main.dart';
import 'package:ai_lawyer_kz/src/features/cases/case_screens.dart';
import 'package:ai_lawyer_kz/src/features/documents/document_screens.dart';
import 'package:ai_lawyer_kz/src/features/legal/legal_screens.dart';
import 'package:ai_lawyer_kz/src/features/subscription/subscription_screen.dart';
import 'package:ai_lawyer_kz/src/features/workflows/workflow_screens.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('shows the main voice action', (tester) async {
    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pumpWidget(const AiLawyerApp());

    expect(find.text('Рассказать проблему'), findsOneWidget);
    await tester.drag(find.text('Рассказать проблему'), const Offset(0, -500));
    await tester.pumpAndSettle();
    expect(find.text('Последние дела'), findsOneWidget);
  });

  testWidgets('opens login route', (tester) async {
    await tester.pumpWidget(const AiLawyerApp());

    await tester.tap(find.byIcon(Icons.mic_none));
    await tester.pumpAndSettle();
    expect(find.text('Вход и регистрация'), findsWidgets);
  });

  testWidgets('shows case intake screen', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: NewCaseScreen()));

    expect(find.text('Подтвердить и создать дело'), findsOneWidget);
  });

  testWidgets('shows documents OCR review screen', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: DocumentsScreen()));

    expect(find.text('OCR-review'), findsOneWidget);
    expect(find.text('Подтвердить поля'), findsOneWidget);
  });

  testWidgets('shows legal citation guardrails screen', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: LegalSourcesScreen()));

    expect(find.text('Официальные источники РК'), findsOneWidget);
    expect(find.text('Citation Validator'), findsOneWidget);
  });

  testWidgets('shows pretrial claim builder', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: PretrialClaimScreen()));

    expect(find.text('Конструктор документа'), findsOneWidget);
    expect(find.text('Сформировать проект'), findsOneWidget);
  });

  testWidgets('shows subscription budget screen', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: SubscriptionScreen()));

    expect(find.text('Лимиты и расходы'), findsOneWidget);
    expect(find.text('AI расходы считаются без персональных данных.'),
        findsOneWidget);
  });
}
