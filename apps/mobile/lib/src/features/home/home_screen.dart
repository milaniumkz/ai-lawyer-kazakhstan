import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../theme/app_theme.dart';
import '../../widgets/app_bottom_nav.dart';
import '../../widgets/aizan_design.dart';
import '../cases/case_screens.dart';

class OnboardingScreen extends StatelessWidget {
  const OnboardingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(),
              const _OnboardingEmblem(),
              const SizedBox(height: 28),
              Text(
                'AI Юрист Казахстан',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.displayMedium?.copyWith(
                      color: AppColors.goldDark,
                      fontFamily: 'Georgia',
                      letterSpacing: 0,
                    ),
              ),
              const SizedBox(height: 18),
              const _GoldDivider(),
              const SizedBox(height: 18),
              const Text(
                'Ваш умный юридический помощник',
                textAlign: TextAlign.center,
              ),
              const Spacer(),
              FilledButton.icon(
                onPressed: () => context.go('/login'),
                icon: const Icon(Icons.auto_awesome),
                label: const Text('Начать работу'),
              ),
              TextButton(
                onPressed: () => context.go('/login'),
                child: const Text('Войти в аккаунт'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OnboardingEmblem extends StatelessWidget {
  const _OnboardingEmblem();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 210,
      height: 210,
      margin: const EdgeInsets.symmetric(horizontal: 42),
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.gold, width: 1.4),
        boxShadow: const [
          BoxShadow(color: Color(0x22D8A13A), blurRadius: 42, spreadRadius: 18),
        ],
      ),
      child: Center(
        child: Container(
          width: 124,
          height: 124,
          decoration: const BoxDecoration(
            shape: BoxShape.circle,
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Color(0xFFFFE49A), AppColors.gold],
            ),
          ),
          child: const Icon(
            Icons.balance_outlined,
            size: 76,
            color: AppColors.graphite,
          ),
        ),
      ),
    );
  }
}

class _GoldDivider extends StatelessWidget {
  const _GoldDivider();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: const [
        Expanded(child: Divider(color: AppColors.gold)),
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 10),
          child: Text('◇', style: TextStyle(color: AppColors.gold)),
        ),
        Expanded(child: Divider(color: AppColors.gold)),
      ],
    );
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key, this.caseApi});
  final CaseApiPort? caseApi;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const AizanHeader(home: true, newCase: true),
      bottomNavigationBar: const AppBottomNav(selectedIndex: 0),
      body: SafeArea(
        top: false,
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 480),
            child: ListView(
              padding: const EdgeInsets.fromLTRB(24, 25, 24, 40),
              children: [
                Center(
                  child: Semantics(
                    label: 'Рассказать проблему', button: true,
                    child: InkWell(
                      key: const ValueKey('home-voice'),
                      borderRadius: BorderRadius.circular(110),
                      onTap: () {
                        MobileCaseRuntime.preferVoiceInput = true;
                        context.go('/case/new');
                      },
                      child: const AizanArt(AizanArtwork.microphone, width: 200),
                    ),
                  ),
                ),
                const SizedBox(height: 23),
                const Text('Нажмите, чтобы говорить', textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 18, color: Colors.white)),
                const SizedBox(height: 25),
                Center(
                  child: SizedBox(
                    width: 190,
                    child: OutlinedButton.icon(
                      key: const ValueKey('home-text'),
                      onPressed: () {
                        MobileCaseRuntime.preferVoiceInput = false;
                        context.go('/case/new');
                      },
                      icon: const Icon(Icons.keyboard_outlined, size: 27),
                      label: const Text('Ввести текст'),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
