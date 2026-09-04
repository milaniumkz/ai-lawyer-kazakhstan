import 'package:flutter/material.dart';

import '../../theme/app_theme.dart';

class LegalSourcesScreen extends StatelessWidget {
  const LegalSourcesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Нормы права')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Text(
              'Официальные источники РК',
              style: Theme.of(context)
                  .textTheme
                  .headlineMedium
                  ?.copyWith(color: AppColors.goldDark),
            ),
            const SizedBox(height: 16),
            const TextField(
              decoration: InputDecoration(
                labelText: 'Поиск нормы права',
                prefixIcon: Icon(Icons.search_outlined),
              ),
            ),
            const SizedBox(height: 16),
            const _SafeRefusalCard(),
            const SizedBox(height: 12),
            const _CitationCard(),
          ],
        ),
      ),
    );
  }
}

class _SafeRefusalCard extends StatelessWidget {
  const _SafeRefusalCard();

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            const Icon(Icons.gpp_maybe_outlined, color: AppColors.gold),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Если официальное подтверждение не найдено, ответ уходит в уточнение или экспертную проверку.',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CitationCard extends StatelessWidget {
  const _CitationCard();

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: const Icon(Icons.verified_outlined, color: AppColors.gold),
        title: const Text('Citation Validator'),
        subtitle: const Text(
            'Проверяет акт, статью, статус, дату применимости, источник и совпадение цитаты.'),
        trailing: const Icon(Icons.chevron_right),
        onTap: () {},
      ),
    );
  }
}
