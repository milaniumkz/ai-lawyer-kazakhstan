import 'package:ai_lawyer_kz/main.dart';
import 'package:ai_lawyer_kz/src/features/cases/case_screens.dart';
import 'package:ai_lawyer_kz/src/features/documents/document_screens.dart';
import 'package:ai_lawyer_kz/src/features/legal/legal_screens.dart';
import 'package:ai_lawyer_kz/src/features/subscription/subscription_screen.dart';
import 'package:ai_lawyer_kz/src/features/workflows/workflow_screens.dart';
import 'package:ai_lawyer_kz/src/api/api_contract.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('generated API contract exposes auth and case paths', () {
    expect(ApiContract.authRegister, '/auth/register');
    expect(ApiContract.cases, '/cases');
  });

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

  testWidgets('case intake voice button and create action work',
      (tester) async {
    await tester.pumpWidget(const MaterialApp(home: NewCaseScreen()));

    await tester.tap(find.byIcon(Icons.mic_none));
    await tester.pumpAndSettle();
    expect(find.text('Запись активна'), findsOneWidget);

    await tester.tap(find.byIcon(Icons.stop));
    await tester.pumpAndSettle();
    expect(find.text('Голос готов к обработке'), findsOneWidget);
  });

  testWidgets('chat send button adds user and assistant messages',
      (tester) async {
    await tester.pumpWidget(const MaterialApp(home: CaseChatScreen()));

    await tester.enterText(find.byType(TextField), 'Какие документы нужны?');
    await tester.ensureVisible(find.byTooltip('Отправить'));
    await tester.tap(find.byTooltip('Отправить'));
    await tester.pumpAndSettle();

    expect(find.text('Какие документы нужны?'), findsOneWidget);
    await tester.drag(find.byType(ListView), const Offset(0, -300));
    await tester.pumpAndSettle();
    expect(find.textContaining('Для ответа потребуется'), findsOneWidget);
  });

  testWidgets('document upload scan and OCR confirmation buttons work',
      (tester) async {
    await tester.pumpWidget(const MaterialApp(home: DocumentsScreen()));

    await tester.tap(find.text('Загрузить файл'));
    await tester.pumpAndSettle();
    expect(find.text('Файл добавлен'), findsOneWidget);

    await tester.tap(find.text('Сканировать документ'));
    await tester.pumpAndSettle();
    expect(find.text('Скан готов'), findsOneWidget);

    await tester.tap(find.text('Подтвердить поля'));
    await tester.pumpAndSettle();
    expect(find.text('Поля подтверждены'), findsOneWidget);
  });

  testWidgets('pretrial claim generation button updates draft', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: PretrialClaimScreen()));

    await tester.tap(find.text('Сформировать проект'));
    await tester.pumpAndSettle();

    expect(find.text('Проект сформирован'), findsOneWidget);
    expect(find.textContaining('сформирован'), findsWidgets);
  });

  testWidgets('shows subscription budget screen', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: SubscriptionScreen()));

    expect(find.text('Лимиты и расходы'), findsOneWidget);
    expect(find.text('AI расходы считаются без персональных данных.'),
        findsOneWidget);
  });

  testWidgets('subscription payment button shows blocker dialog',
      (tester) async {
    await tester.pumpWidget(const MaterialApp(home: SubscriptionScreen()));

    await tester.tap(find.text('Управление оплатой недоступно в stub mode'));
    await tester.pumpAndSettle();

    expect(find.text('Оплата недоступна'), findsOneWidget);
    expect(find.textContaining('Payment provider'), findsOneWidget);
  });
}
