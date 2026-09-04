import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

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
              onPressed: () {
                setState(() => generated = true);
                context.go('/workflow/pretrial-claim/draft');
              },
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

class ClaimDraftScreen extends StatefulWidget {
  const ClaimDraftScreen({super.key});

  @override
  State<ClaimDraftScreen> createState() => _ClaimDraftScreenState();
}

class _ClaimDraftScreenState extends State<ClaimDraftScreen> {
  var approved = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Проект досудебной претензии')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            const Card(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Text(
                  'Прошу погасить задолженность по договору займа. Перед отправкой документ требует проверки юристом.',
                ),
              ),
            ),
            CheckboxListTile(
              value: approved,
              onChanged: (value) => setState(() => approved = value ?? false),
              title: const Text('Проверено пользователем'),
            ),
            FilledButton.icon(
              onPressed: approved
                  ? () => context.go('/workflow/pretrial-claim/send')
                  : null,
              icon: const Icon(Icons.send_outlined),
              label: const Text('Перейти к отправке'),
            ),
          ],
        ),
      ),
    );
  }
}

class ClaimSendScreen extends StatefulWidget {
  const ClaimSendScreen({super.key});

  @override
  State<ClaimSendScreen> createState() => _ClaimSendScreenState();
}

class _ClaimSendScreenState extends State<ClaimSendScreen> {
  var sent = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Отправка претензии')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            const Card(
              child: ListTile(
                leading: Icon(Icons.info_outline),
                title: Text('Assisted submission'),
                subtitle: Text(
                    'Официальная интеграция не подключена. Отправка фиксируется как ручной шаг.'),
              ),
            ),
            FilledButton.icon(
              onPressed: () => setState(() => sent = true),
              icon: const Icon(Icons.mark_email_read_outlined),
              label: Text(
                  sent ? 'Отправка зафиксирована' : 'Зафиксировать отправку'),
            ),
          ],
        ),
      ),
    );
  }
}
