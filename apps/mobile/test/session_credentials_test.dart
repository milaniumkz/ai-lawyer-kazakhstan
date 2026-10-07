import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:ai_lawyer_kz/src/api/session_credentials.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUp(() {
    FlutterSecureStorage.setMockInitialValues({});
    SessionCredentials.token = '';
  });
  test('session survives process state reset and is erased on logout',
      () async {
    await SessionCredentials.save(
        userId: 'owner',
        accessToken: 'fixture',
        profileComplete: true,
        displayName: 'User');
    SessionCredentials.token = '';
    final restored = await SessionCredentials.restore();
    expect(restored?['userId'], 'owner');
    expect(restored?['profileComplete'], true);
    expect(SessionCredentials.token, 'fixture');
    await SessionCredentials.clear();
    expect(await SessionCredentials.restore(), isNull);
    expect(SessionCredentials.token, isEmpty);
  });
  test('corrupt stored session does not authenticate', () async {
    FlutterSecureStorage.setMockInitialValues({'aizan_session_v1': '{invalid'});
    expect(await SessionCredentials.restore(), isNull);
    expect(SessionCredentials.token, isEmpty);
  });
}
