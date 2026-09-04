import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../theme/app_theme.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      bottomNavigationBar: NavigationBar(
        selectedIndex: 0,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            label: 'Главная',
          ),
          NavigationDestination(
            icon: Icon(Icons.business_center_outlined),
            label: 'Дела',
          ),
          NavigationDestination(
            icon: Icon(Icons.folder_outlined),
            label: 'Документы',
          ),
          NavigationDestination(
            icon: Icon(Icons.calendar_month_outlined),
            label: 'Сроки',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            label: 'Профиль',
          ),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Здравствуйте',
                    style: theme.textTheme.displaySmall?.copyWith(
                      color: AppColors.goldDark,
                    ),
                  ),
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
                  route: '/case/chat',
                ),
                _ActionCard(
                  icon: Icons.calendar_month_outlined,
                  title: 'Сроки',
                  subtitle: 'Даты и напоминания',
                  route: '/case/chat',
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
            const SizedBox(height: 12),
            const _CaseCard(
              title: 'Взыскание долга',
              subtitle: 'Дело №2024-0015 · Гражданское право',
              status: 'В работе',
            ),
            const _CaseCard(
              title: 'Алименты',
              subtitle: 'Дело №2024-0012 · Семейное право',
              status: 'Подготовка документов',
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
  });

  final String title;
  final String subtitle;
  final String status;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: const CircleAvatar(child: Icon(Icons.balance_outlined)),
        title: Text(title),
        subtitle: Text('$subtitle\n$status'),
        trailing: const Icon(Icons.chevron_right),
        isThreeLine: true,
      ),
    );
  }
}
