import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../theme/app_theme.dart';

class NewCaseScreen extends StatelessWidget {
  const NewCaseScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _CaseScaffold(
      title: 'Новое дело',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: FilledButton(
              onPressed: () {},
              style: FilledButton.styleFrom(
                  shape: const CircleBorder(), fixedSize: const Size(148, 148)),
              child: const Icon(Icons.mic_none, size: 58),
            ),
          ),
          const SizedBox(height: 18),
          const TextField(
            minLines: 5,
            maxLines: 8,
            decoration: InputDecoration(
              labelText: 'Проверьте описание проблемы',
              alignLabelWithHint: true,
              prefixIcon: Icon(Icons.edit_note_outlined),
            ),
          ),
          const SizedBox(height: 16),
          const _ProgressStrip(),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: () => context.go('/workflow/pretrial-claim'),
            icon: const Icon(Icons.check_circle_outline),
            label: const Text('Подтвердить и создать дело'),
          ),
        ],
      ),
    );
  }
}

class CaseChatScreen extends StatelessWidget {
  const CaseChatScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _CaseScaffold(
      title: 'Чат по делу',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const _CaseSummaryCard(),
          const SizedBox(height: 16),
          const _MessageBubble(
            text:
                'AI может ошибаться. Нужны подтвержденные официальные источники РК.',
            assistant: true,
          ),
          const _MessageBubble(
              text: 'Нужно взыскать долг по договору займа.', assistant: false),
          const SizedBox(height: 16),
          TextField(
            minLines: 2,
            maxLines: 4,
            decoration: InputDecoration(
              labelText: 'Сообщение',
              suffixIcon: IconButton(
                tooltip: 'Отправить',
                onPressed: () {},
                icon: const Icon(Icons.send_outlined),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ProgressStrip extends StatelessWidget {
  const _ProgressStrip();

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Статус обработки',
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            const LinearProgressIndicator(value: 1),
            const SizedBox(height: 8),
            const Text('transcribing → classifying → validating → ready'),
          ],
        ),
      ),
    );
  }
}

class _CaseSummaryCard extends StatelessWidget {
  const _CaseSummaryCard();

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Взыскание долга',
                style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            const Text('Категория: гражданско-правовой спор'),
            const Text('Готовность: 17% подготовки, не вероятность выигрыша'),
          ],
        ),
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({required this.text, required this.assistant});

  final String text;
  final bool assistant;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: assistant ? Alignment.centerLeft : Alignment.centerRight,
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 320),
        child: Card(
          color: assistant ? Theme.of(context).cardTheme.color : AppColors.gold,
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Text(text),
          ),
        ),
      ),
    );
  }
}

class _CaseScaffold extends StatelessWidget {
  const _CaseScaffold({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Text(title,
                style: Theme.of(context)
                    .textTheme
                    .headlineMedium
                    ?.copyWith(color: AppColors.goldDark)),
            const SizedBox(height: 24),
            child,
          ],
        ),
      ),
    );
  }
}
