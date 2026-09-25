import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../theme/app_theme.dart';
import '../../widgets/app_bottom_nav.dart';
import '../auth/auth_screens.dart';
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

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, this.caseApi});

  final CaseApiPort? caseApi;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late final CaseApiPort caseApi;
  var cases = const <CaseListItem>[];
  var status = 'Данные из БД еще не загружены';

  @override
  void initState() {
    super.initState();
    caseApi = widget.caseApi ?? HttpCaseApi();
    refreshCases();
  }

  Future<void> refreshCases() async {
    if (AuthRuntime.userId.isEmpty) {
      setState(() => status = 'Войдите, чтобы загрузить данные из БД');
      return;
    }
    setState(() => status = 'Загружаю данные из БД...');
    try {
      final remote = await caseApi.listCases(AuthRuntime.userId);
      setState(() {
        cases = remote;
        status = remote.isEmpty
            ? 'В БД пока нет дел'
            : 'Дела загружены из БД: ${remote.length}';
      });
    } catch (error) {
      setState(() => status = 'Ошибка загрузки из БД: $error');
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final displayName = AuthRuntime.displayName.trim();
    return Scaffold(
      bottomNavigationBar: const AppBottomNav(selectedIndex: 0),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    displayName.isEmpty
                        ? 'Войдите, чтобы продолжить'
                        : 'Здравствуйте, $displayName',
                    style: theme.textTheme.displaySmall?.copyWith(
                      color: AppColors.goldDark,
                    ),
                  ),
                ),
                IconButton(
                  tooltip: 'Уведомления',
                  onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(status)),
                  ),
                  icon: const Icon(Icons.notifications_none),
                ),
                IconButton(
                  tooltip: 'Обновить из БД',
                  onPressed: refreshCases,
                  icon: const Icon(Icons.sync_outlined),
                ),
                IconButton(
                  key: const ValueKey('home-profile'),
                  tooltip: 'Профиль',
                  onPressed: () => context.go('/profile'),
                  icon: const Icon(Icons.person_outline),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'Ваш умный юридический помощник',
              style: theme.textTheme.titleMedium,
            ),
            const SizedBox(height: 42),
            Center(
              child: FilledButton(
                onPressed: () {
                  MobileCaseRuntime.startDraft();
                  context.go('/case/new');
                },
                style: FilledButton.styleFrom(
                  shape: const CircleBorder(),
                  fixedSize: const Size(176, 176),
                ),
                child: const Icon(Icons.mic_none, size: 72),
              ),
            ),
            const SizedBox(height: 18),
            Center(
              child: Text(
                'Рассказать проблему',
                style: theme.textTheme.headlineSmall,
              ),
            ),
            Center(
              child: Text(
                'Нажмите и говорите голосом',
                style: theme.textTheme.bodyMedium,
              ),
            ),
            const SizedBox(height: 32),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: const [
                _ActionCard(
                  icon: Icons.business_center_outlined,
                  title: 'Новое дело',
                  subtitle: 'Создать новое дело',
                  route: '/case/new',
                  startDraft: true,
                ),
                _ActionCard(
                  icon: Icons.description_outlined,
                  title: 'Мои документы',
                  subtitle: 'Просмотр и загрузка',
                  route: '/documents',
                ),
                _ActionCard(
                  icon: Icons.calendar_month_outlined,
                  title: 'Сроки',
                  subtitle: 'Даты и напоминания',
                  route: '/deadlines',
                ),
              ],
            ),
            const SizedBox(height: 32),
            Text(
              'Последние дела',
              style: theme.textTheme.headlineSmall?.copyWith(
                color: AppColors.goldDark,
              ),
            ),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(
                onPressed: () => context.go('/cases'),
                icon: const Icon(Icons.chevron_right),
                label: const Text('Все дела'),
              ),
            ),
            const SizedBox(height: 12),
            Text(status, style: theme.textTheme.bodySmall),
            const SizedBox(height: 12),
            if (cases.isEmpty)
              _CaseCard(
                title: 'Нет дел',
                subtitle: 'Создайте первое дело',
                status: 'Только реальные данные из БД',
                route: '/case/new',
                startDraft: true,
              )
            else
              for (final item in cases.take(2))
                _CaseCard(
                  title: item.title,
                  subtitle: item.subtitle,
                  status: item.status,
                  route: '/case/details',
                ),
          ],
        ),
      ),
    );
  }
}

class _ActionCard extends StatelessWidget {
  const _ActionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.route,
    this.startDraft = false,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final String route;
  final bool startDraft;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 160,
      height: 176,
      child: InkWell(
        onTap: () {
          if (startDraft) MobileCaseRuntime.startDraft();
          context.go(route);
        },
        borderRadius: BorderRadius.circular(20),
        child: Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, color: AppColors.gold, size: 34),
                const SizedBox(height: 12),
                Text(title,
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _CaseCard extends StatelessWidget {
  const _CaseCard({
    required this.title,
    required this.subtitle,
    required this.status,
    required this.route,
    this.startDraft = false,
  });

  final String title;
  final String subtitle;
  final String status;
  final String route;
  final bool startDraft;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        onTap: () {
          if (startDraft) MobileCaseRuntime.startDraft();
          context.go(route);
        },
        leading: const CircleAvatar(child: Icon(Icons.balance_outlined)),
        title: Text(title),
        subtitle: Text('$subtitle\n$status'),
        trailing: const Icon(Icons.chevron_right),
        isThreeLine: true,
      ),
    );
  }
}
