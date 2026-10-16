import 'package:ai_lawyer_kz/src/api/session_http.dart' as session;
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as transport;
import 'package:http/testing.dart';
import 'dart:async';

void main() {
  for (final path in [
    '/api/v1/cases/test-case/messages',
    '/api/v1/rag/answer'
  ]) {
    testWidgets('legal request survives a response after 30 seconds: $path',
        (tester) async {
      transport.Response? result;
      Object? error;
      transport.runWithClient(
          () => session
                  .post(Uri.parse('https://example.invalid$path'))
                  .then<void>((response) {
                result = response;
              }, onError: (Object failure) {
                error = failure;
              }),
          () => MockClient((_) async {
                await Future<void>.delayed(const Duration(seconds: 31));
                return transport.Response('synthetic legal response', 200);
              }));
      await tester.pump();
      await tester.pump(const Duration(seconds: 31));
      expect(error, isNull);
      expect(result?.statusCode, 200);
    });
  }
  testWidgets('ordinary profile requests retain their 30 second deadline',
      (tester) async {
    Object? error;
    transport.runWithClient(
        () => session
                .post(Uri.parse('https://example.invalid/api/v1/profiles'))
                .then<void>((_) {}, onError: (Object failure) {
              error = failure;
            }),
        () => MockClient((_) async {
              await Future<void>.delayed(const Duration(seconds: 31));
              return transport.Response('synthetic profile', 200);
            }));
    await tester.pump();
    await tester.pump(const Duration(seconds: 31));
    expect(error, isA<TimeoutException>());
  });
}
