import 'package:flutter/widgets.dart';

/// Network/permission operations may finish after navigation disposes a screen.
mixin MountedState<T extends StatefulWidget> on State<T> {
  void updateState(VoidCallback update) {
    if (mounted) setState(update);
  }
}
