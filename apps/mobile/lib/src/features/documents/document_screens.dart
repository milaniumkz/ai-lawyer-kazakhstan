import 'package:flutter/material.dart';

import '../../theme/app_theme.dart';

class DocumentsScreen extends StatelessWidget {
  const DocumentsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Документы и доказательства')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Text(
              'Загрузка документов',
              style: Theme.of(context)
                  .textTheme
                  .headlineMedium
                  ?.copyWith(color: AppColors.goldDark),
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.upload_file_outlined),
              label: const Text('Загрузить файл'),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.document_scanner_outlined),
              label: const Text('Сканировать документ'),
            ),
            const SizedBox(height: 16),
            const _OcrReviewCard(),
            const SizedBox(height: 12),
            const _EvidenceCard(),
          ],
        ),
      ),
    );
  }
}

class _OcrReviewCard extends StatelessWidget {
  const _OcrReviewCard();

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('OCR-review', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            const Text('Извлеченные поля требуют подтверждения пользователя.'),
            const SizedBox(height: 12),
            const TextField(
                decoration: InputDecoration(labelText: 'Название документа')),
            const SizedBox(height: 8),
            const TextField(
                decoration: InputDecoration(labelText: 'Сумма / реквизиты')),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.check_outlined),
              label: const Text('Подтвердить поля'),
            ),
          ],
        ),
      ),
    );
  }
}

class _EvidenceCard extends StatelessWidget {
  const _EvidenceCard();

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: const Icon(Icons.folder_copy_outlined, color: AppColors.gold),
        title: const Text('Договор и переписка'),
        subtitle: const Text(
            'Предварительная оценка: возможная допустимость. Не оценка суда.'),
        trailing: const Icon(Icons.chevron_right),
        onTap: () {},
      ),
    );
  }
}
