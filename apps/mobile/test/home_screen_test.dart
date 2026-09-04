import 'package:ai_lawyer_kz/main.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('shows the main voice action', (tester) async {
    await tester.pumpWidget(const AiLawyerApp());

    expect(find.text('Рассказать проблему'), findsOneWidget);
    await tester.drag(find.text('Рассказать проблему'), const Offset(0, -500));
    await tester.pumpAndSettle();
    expect(find.text('Последние дела'), findsOneWidget);
  });
}
