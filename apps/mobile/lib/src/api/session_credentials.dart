import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

abstract final class SessionCredentials {
  static String token = '';
  static const _storage = FlutterSecureStorage();
  static const _key = 'aizan_session_v1';
  static Future<void> save(
      {required String userId,
      required String accessToken,
      required bool profileComplete,
      required String displayName}) async {
    token = accessToken;
    if (token.isEmpty) {
      return;
    }
    await _storage.write(
        key: _key,
        value: jsonEncode({
          'userId': userId,
          'token': token,
          'profileComplete': profileComplete,
          'displayName': displayName
        }));
  }

  static Future<Map<String, dynamic>?> restore() async {
    try {
      final value = await _storage.read(key: _key);
      if (value == null) return null;
      final saved = jsonDecode(value) as Map<String, dynamic>;
      if (saved['token'] is! String ||
          (saved['token'] as String).isEmpty ||
          saved['userId'] is! String) {
        return null;
      }
      token = saved['token'] as String;
      return saved;
    } catch (_) {
      return null;
    }
  }

  static Future<void> clear() async {
    final hadToken = token.isNotEmpty;
    token = '';
    if (hadToken) await _storage.delete(key: _key);
  }
}
