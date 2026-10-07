import 'dart:async';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

Future<void> testExecutable(FutureOr<void> Function() testMain) async {
  TestWidgetsFlutterBinding.ensureInitialized();
  for (final font in {
    'AizanSans': 'assets/fonts/OpenSans-Regular.ttf',
    'AizanSerif': 'assets/fonts/LiberationSerif-Regular.ttf',
    'MaterialIcons': 'fonts/MaterialIcons-Regular.otf'
  }.entries) {
    final loader = FontLoader(font.key)..addFont(rootBundle.load(font.value));
    await loader.load();
  }
  await testMain();
}
