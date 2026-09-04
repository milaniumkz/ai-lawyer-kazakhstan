import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../theme/app_theme.dart';
import '../../widgets/app_bottom_nav.dart';

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
              Icon(Icons.balance_outlined, size: 112, color: AppColors.gold),
              const SizedBox(height: 24),
              Text(
                'AI Юрист Казахстан',
                textAlign: TextAlign.center,
                style: Theme.of(context)
                    .textTheme
                    .displaySmall
                    ?.copyWith(color: AppColors.goldDark),
              ),
              const SizedBox(height: 12),
              const Text(
                'Юридический помощник с проверкой официальных источников РК.',
                textAlign: TextAlign.center,
              ),
              const Spacer(),
              FilledButton.icon(
                onPressed: () => context.go('/login'),
                icon: const Icon(Icons.arrow_forward),
                label: const Text('Начать'),
              ),
              TextButton(
                onPressed: () => context.go('/'),
                child: const Text('Уже есть аккаунт'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
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
                    'Здравствуйте, Дмитрий',
                    style: theme.textTheme.displaySmall?.copyWith(
                      color: AppColors.goldDark,
                    ),
                  ),
                ),
                IconButton(
                  tooltip: 'Уведомления',
                  onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Новых уведомлений нет')),
                  ),
                  icon: const Icon(Icons.notifications_none),
                ),
                IconButton(
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
                onPressed: () => context.go('/login'),
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
                  route: '/legal',
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
            const _CaseCard(
              title: 'Взыскание долга',
              subtitle: 'Дело №2024-0015 · Гражданское право',
              status: 'В работе',
              route: '/case/details',
            ),
            const _CaseCard(
              title: 'Алименты',
              subtitle: 'Дело №2024-0012 · Семейное право',
              status: 'Подготовка документов',
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
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final String route;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 160,
      height: 176,
      child: InkWell(
        onTap: () => context.go(route),
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
  });

  final String title;
  final String subtitle;
  final String status;
  final String route;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        onTap: () => context.go(route),
        leading: const CircleAvatar(child: Icon(Icons.balance_outlined)),
        title: Text(title),
        subtitle: Text('$subtitle\n$status'),
        trailing: const Icon(Icons.chevron_right),
        isThreeLine: true,
      ),
    );
  }
}
