import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../features/cases/case_screens.dart';

abstract final class AizanDesign {
  static const gold = Color(0xFFFFD77B);
  static const border = Color(0xFFAF7D2E);
  static const background = BoxDecoration(
    gradient: RadialGradient(
      center: Alignment.topLeft,
      radius: .8,
      colors: [Color(0xFF63330F), Color(0xFF160A02), Color(0xFF0B0501)],
      stops: [0, .38, 1],
    ),
  );
  static const goldGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFFFEBA4), Color(0xFFFFCB63), Color(0xFFC98827)],
  );
}

enum AizanArtwork { brand, microphone, voice, analysis, upload, authBrand }

/// Clip decorative artwork only. Text, fields and buttons are Flutter widgets;
/// no reference screenshot is used as an application screen or hitbox layer.
class AizanArt extends StatelessWidget {
  const AizanArt(this.artwork, {super.key, this.width});
  final AizanArtwork artwork;
  final double? width;

  @override
  Widget build(BuildContext context) {
    final (source, size, crop) = switch (artwork) {
      AizanArtwork.brand => (
          'home',
          const Size(941, 1672),
          const Rect.fromLTWH(350, 130, 245, 250)
        ),
      AizanArtwork.microphone => (
          'home',
          const Size(941, 1672),
          const Rect.fromLTWH(225, 535, 495, 475)
        ),
      AizanArtwork.voice => (
          'voice',
          const Size(852, 1846),
          const Rect.fromLTWH(68, 398, 720, 470)
        ),
      AizanArtwork.analysis => (
          'analysis',
          const Size(852, 1846),
          const Rect.fromLTWH(200, 220, 445, 295)
        ),
      AizanArtwork.upload => (
          'upload',
          const Size(852, 1846),
          const Rect.fromLTWH(215, 327, 430, 355)
        ),
      AizanArtwork.authBrand => (
          'login',
          const Size(941, 1672),
          const Rect.fromLTWH(40, 70, 860, 575)
        ),
    };
    return ExcludeSemantics(
      child: SizedBox(
        width: width,
        child: LayoutBuilder(builder: (context, constraints) {
          final actualWidth = constraints.maxWidth.isFinite
              ? constraints.maxWidth
              : width ?? crop.width;
          final scale = actualWidth / crop.width;
          final clippedArt = SizedBox(
            width: actualWidth,
            height: crop.height * scale,
            child: ClipRect(
              child: Stack(children: [
                Positioned(
                  left: -crop.left * scale,
                  top: -crop.top * scale,
                  width: size.width * scale,
                  height: size.height * scale,
                  child:
                      Image.asset('assets/aizan/$source.png', fit: BoxFit.fill),
                ),
              ]),
            ),
          );
          final decoration = artwork == AizanArtwork.authBrand
              ? ClipPath(clipper: _AuthDecorationClipper(), child: clippedArt)
              : clippedArt;
          return ShaderMask(
            shaderCallback: (bounds) => (artwork == AizanArtwork.authBrand
                    ? const LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                            Colors.transparent,
                            Colors.white,
                            Colors.white,
                            Colors.transparent
                          ],
                        stops: [
                            0,
                            .08,
                            .88,
                            1
                          ])
                    : const RadialGradient(colors: [
                        Colors.white,
                        Colors.white,
                        Colors.transparent
                      ], stops: [
                        0,
                        .78,
                        1
                      ], radius: .72))
                .createShader(bounds),
            blendMode: BlendMode.dstIn,
            child: decoration,
          );
        }),
      ),
    );
  }
}

class _AuthDecorationClipper extends CustomClipper<Path> {
  @override
  Path getClip(Size size) => Path()
    ..moveTo(size.width * 190 / 860, 0)
    ..lineTo(size.width * 675 / 860, 0)
    ..lineTo(size.width * 675 / 860, size.height * 225 / 575)
    ..lineTo(size.width, size.height * 225 / 575)
    ..lineTo(size.width, size.height)
    ..lineTo(0, size.height)
    ..lineTo(0, size.height * 225 / 575)
    ..lineTo(size.width * 190 / 860, size.height * 225 / 575)
    ..close();
  @override
  bool shouldReclip(_AuthDecorationClipper oldClipper) => false;
}

class AizanHeader extends StatelessWidget implements PreferredSizeWidget {
  const AizanHeader(
      {super.key,
      this.home = false,
      this.newCase = false,
      this.compact = false,
      this.onNewCase});
  final bool home;
  final bool newCase;
  final bool compact;
  final VoidCallback? onNewCase;

  @override
  Size get preferredSize => Size.fromHeight(home
      ? 190
      : compact
          ? 160
          : 160);

  @override
  Widget build(BuildContext context) => SafeArea(
        bottom: false,
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 480),
            child: SizedBox(
              height: preferredSize.height,
              child: Stack(children: [
                Align(
                  alignment: Alignment.topCenter,
                  child: Padding(
                    padding: EdgeInsets.only(top: home ? 45 : 20),
                    child: FittedBox(
                        fit: BoxFit.scaleDown,
                        child:
                            Column(mainAxisSize: MainAxisSize.min, children: [
                          AizanArt(AizanArtwork.brand, width: home ? 100 : 80),
                          const SizedBox(height: 8),
                          const Text('ВАШ ЮРИДИЧЕСКИЙ\nAI-ПОМОЩНИК',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                  fontSize: 8,
                                  letterSpacing: 3,
                                  height: 1.6,
                                  color: AizanDesign.gold)),
                        ])),
                  ),
                ),
                Positioned(
                    top: 22,
                    left: 20,
                    child: IconButton.outlined(
                      tooltip: newCase ? 'Новое дело' : 'Назад',
                      onPressed: () {
                        if (onNewCase != null) {
                          onNewCase!();
                          return;
                        }
                        if (newCase) {
                          MobileCaseRuntime.startDraft();
                          context.go('/');
                        } else if (context.canPop()) {
                          context.pop();
                        } else {
                          context.go('/');
                        }
                      },
                      icon: Icon(newCase ? Icons.add : Icons.arrow_back,
                          color: AizanDesign.gold),
                    )),
                Positioned(
                    top: 22,
                    right: 20,
                    child: IconButton(
                      tooltip: 'Настройки',
                      onPressed: () => context.go('/settings'),
                      icon: const Icon(Icons.settings_outlined,
                          color: AizanDesign.gold, size: 29),
                    )),
              ]),
            ),
          ),
        ),
      );
}

class AizanButton extends StatelessWidget {
  const AizanButton(
      {super.key, required this.label, required this.onPressed, this.icon});
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;

  @override
  Widget build(BuildContext context) => DecoratedBox(
        decoration: BoxDecoration(
            gradient: AizanDesign.goldGradient,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: const Color(0xFFFFE7A0)),
            boxShadow: const [
              BoxShadow(color: Color(0x44F7B635), blurRadius: 12)
            ]),
        child: FilledButton.icon(
          onPressed: onPressed,
          style: FilledButton.styleFrom(
              backgroundColor: Colors.transparent,
              foregroundColor: const Color(0xFF1B1002),
              disabledBackgroundColor: const Color(0x99865D27)),
          icon: Icon(icon ?? Icons.arrow_forward, size: 22),
          label: Text(label),
        ),
      );
}
