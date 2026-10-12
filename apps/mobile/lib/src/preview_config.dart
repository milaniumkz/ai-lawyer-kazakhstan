import 'dart:io';
import 'package:flutter/foundation.dart';

// Enabled only in simulator review builds, never in signed release builds.
const nativePreviewEnabled =
    kDebugMode && bool.fromEnvironment('AI_LAWYER_PREVIEW_MODE');

String nativePreviewRoute(String fallback) => nativePreviewEnabled && !kIsWeb
    ? Platform.environment['AIZAN_PREVIEW_ROUTE'] ?? fallback
    : fallback;

Future<void> confirmNativePreviewRoute(String route) async {
  if (!nativePreviewEnabled || kIsWeb) return;
  final path = Platform.environment['AIZAN_PREVIEW_CONFIRMATION_PATH'];
  if (path == null) throw StateError('Native preview confirmation path missing');
  await File(path).writeAsString(route, flush: true);
}
