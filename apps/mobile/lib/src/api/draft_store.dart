import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'session_credentials.dart';

abstract final class DraftStore {
  static const _storage = FlutterSecureStorage();
  static Map<String, dynamic> values = {};
  static Future<void>? _pending;
  static String _owner = '';
  static Future<void> restore(String owner) async {
    if (_pending != null) await _pending!.catchError((_) {});
    _owner = owner;
    values = {};
    if (SessionCredentials.token.isEmpty) return;
    try {
      final raw = await _storage.read(key: 'aizan_drafts_$owner');
      if (raw != null) values = jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      values = {};
    }
  }

  static Future<void> put(String section, Map<String, dynamic> data) {
    values[section] = data;
    if (_owner.isEmpty || SessionCredentials.token.isEmpty) {
      return Future.value();
    }
    final key = 'aizan_drafts_$_owner';
    final value = jsonEncode(values);
    _pending = (_pending ?? Future<void>.value())
        .catchError((_) {})
        .then((_) => _storage.write(key: key, value: value));
    return _pending!;
  }

  static Future<void> clear() async {
    if (_pending != null) await _pending!.catchError((_) {});
    _pending = null;
    if (_owner.isNotEmpty && SessionCredentials.token.isNotEmpty) {
      await _storage.delete(key: 'aizan_drafts_$_owner');
    }
    values = {};
    _owner = '';
  }
}
