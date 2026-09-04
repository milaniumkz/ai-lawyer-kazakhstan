import 'package:flutter/material.dart';

import '../../theme/app_theme.dart';

class PretrialClaimScreen extends StatelessWidget {
  const PretrialClaimScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Досудебная претензия')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Text(
              'Конструктор документа',
              style: Theme.of(context)
                  .textTheme
                  .headlineMedium
                  ?.copyWith(color: AppColors.goldDark),
            ),
            const SizedBox(height: 16),
            const TextField(
                decoration: InputDecoration(labelText: 'Заявитель')),
            const SizedBox(height: 12),
            const TextField(decoration: InputDecoration(labelText: 'Ответчик')),
            const SizedBox(height: 12),
            const TextField(
              keyboardType: TextInputType.number,
              decoration: InputDecoration(labelText: 'Сумма требования, ₸'),
            ),
            const SizedBox(height: 12),
            const TextField(
              minLines: 3,
              maxLines: 5,
              decoration: InputDecoration(labelText: 'Основание требования'),
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.article_outlined),
              label: const Text('Сформировать проект'),
            ),
            const SizedBox(height: 16),
            const Card(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Text(
                    'Проект документа. Требует проверки и подтверждения пользователем.'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
