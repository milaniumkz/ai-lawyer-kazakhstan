import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../theme/app_theme.dart';
import '../../widgets/app_bottom_nav.dart';

class DocumentsScreen extends StatefulWidget {
  const DocumentsScreen({super.key});

  @override
  State<DocumentsScreen> createState() => _DocumentsScreenState();
}

class _DocumentsScreenState extends State<DocumentsScreen> {
  var uploaded = false;
  var scanned = false;
  var confirmed = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Документы и доказательства')),
      bottomNavigationBar: const AppBottomNav(selectedIndex: 2),
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
              onPressed: () => setState(() => uploaded = true),
              icon: const Icon(Icons.upload_file_outlined),
              label: Text(uploaded ? 'Файл добавлен' : 'Загрузить файл'),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () => setState(() => scanned = true),
              icon: const Icon(Icons.document_scanner_outlined),
              label: Text(scanned ? 'Скан готов' : 'Сканировать документ'),
            ),
            const SizedBox(height: 16),
            _OcrReviewCard(
              confirmed: confirmed,
              onConfirm: () => setState(() => confirmed = true),
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: () => context.go('/documents/analysis'),
              icon: const Icon(Icons.analytics_outlined),
              label: const Text('Анализировать документы'),
            ),
            const SizedBox(height: 12),
            _EvidenceCard(
              onTap: () => ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Открыта папка доказательств')),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class DocumentAnalysisScreen extends StatefulWidget {
  const DocumentAnalysisScreen({super.key});

  @override
  State<DocumentAnalysisScreen> createState() => _DocumentAnalysisScreenState();
}

class _DocumentAnalysisScreenState extends State<DocumentAnalysisScreen> {
  var checked = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Анализ документов')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Text(
              'Проверка документов',
              style: Theme.of(context)
                  .textTheme
                  .headlineMedium
                  ?.copyWith(color: AppColors.goldDark),
            ),
            const SizedBox(height: 16),
            LinearProgressIndicator(value: checked ? 1 : 0.62),
            const SizedBox(height: 16),
            const Card(
              child: ListTile(
                leading:
                    Icon(Icons.warning_amber_outlined, color: AppColors.gold),
                title: Text('Не хватает акта сверки'),
                subtitle: Text('Добавьте документ или подтвердите отсутствие.'),
              ),
            ),
            FilledButton.icon(
              onPressed: () => setState(() => checked = true),
              icon: const Icon(Icons.check_outlined),
              label: Text(checked ? 'Анализ завершен' : 'Подтвердить анализ'),
            ),
          ],
        ),
      ),
    );
  }
}

class _OcrReviewCard extends StatelessWidget {
  const _OcrReviewCard({required this.confirmed, required this.onConfirm});

  final bool confirmed;
  final VoidCallback onConfirm;

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
              onPressed: onConfirm,
              icon: Icon(
                  confirmed ? Icons.verified_outlined : Icons.check_outlined),
              label: Text(confirmed ? 'Поля подтверждены' : 'Подтвердить поля'),
            ),
          ],
        ),
      ),
    );
  }
}

class _EvidenceCard extends StatelessWidget {
  const _EvidenceCard({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: const Icon(Icons.folder_copy_outlined, color: AppColors.gold),
        title: const Text('Договор и переписка'),
        subtitle: const Text(
            'Предварительная оценка: возможная допустимость. Не оценка суда.'),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}
