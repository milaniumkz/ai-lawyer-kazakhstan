import 'package:flutter/material.dart';

import '../../theme/app_theme.dart';

class PretrialClaimScreen extends StatefulWidget {
  const PretrialClaimScreen({super.key});

  @override
  State<PretrialClaimScreen> createState() => _PretrialClaimScreenState();
}

class _PretrialClaimScreenState extends State<PretrialClaimScreen> {
  var generated = false;

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
              onPressed: () => setState(() => generated = true),
              icon: const Icon(Icons.article_outlined),
              label: Text(
                  generated ? 'Проект сформирован' : 'Сформировать проект'),
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Text(
                  generated
                      ? 'Проект досудебной претензии сформирован. Перед отправкой требуется проверка юристом и подтверждение пользователя.'
                      : 'Проект документа. Требует проверки и подтверждения пользователем.',
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
