import 'dart:convert';
import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;

import '../../api/api_contract.dart';
import '../auth/auth_screens.dart';
import '../cases/case_screens.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_bottom_nav.dart';

class DocumentsScreen extends StatefulWidget {
  const DocumentsScreen({super.key, this.filePicker, this.documentApi});

  final DocumentFilePickerPort? filePicker;
  final DocumentApiPort? documentApi;

  @override
  State<DocumentsScreen> createState() => _DocumentsScreenState();
}

class _DocumentsScreenState extends State<DocumentsScreen> {
  late final DocumentFilePickerPort filePicker;
  late final DocumentApiPort documentApi;
  var uploaded = false;
  var scanned = false;
  var confirmed = false;
  var busy = false;
  var status = 'Выберите файл для загрузки';
  String? documentId;

  @override
  void initState() {
    super.initState();
    filePicker = widget.filePicker ?? NativeDocumentFilePicker();
    documentApi = widget.documentApi ?? HttpDocumentApi();
  }

  Future<void> uploadDocument() async {
    if (busy) return;
    setState(() {
      busy = true;
      status = 'Открываю выбор файла...';
    });
    try {
      final file = await filePicker.pick();
      if (file == null) {
        setState(() => status = 'Выбор файла отменен');
        return;
      }
      if (MobileCaseRuntime.activeCaseId.isEmpty) {
        setState(
            () => status = 'Сначала создайте дело, затем загрузите документ');
        return;
      }
      final saved = await documentApi.uploadMetadata(
        caseId: MobileCaseRuntime.activeCaseId,
        file: file,
      );
      setState(() {
        uploaded = true;
        documentId = saved.id;
        status = 'Файл добавлен: ${saved.fileName}';
      });
    } catch (error) {
      setState(() => status = 'Документ API ошибка: $error');
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> confirmOcr() async {
    if (busy) return;
    if (documentId == null) {
      setState(() => status = 'Сначала загрузите документ');
      return;
    }
    setState(() => busy = true);
    try {
      await documentApi.confirmOcr(documentId!, {
        'documentTitle': 'Подтверждено пользователем',
        'reviewRequired': 'false',
      });
      setState(() {
        confirmed = true;
        status = 'Поля подтверждены через API';
      });
    } catch (error) {
      setState(() => status = 'OCR API ошибка: $error');
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> createEvidence() async {
    if (MobileCaseRuntime.activeCaseId.isEmpty) {
      setState(() => status = 'Сначала создайте дело');
      return;
    }
    try {
      final id = await documentApi.createEvidence(
        caseId: MobileCaseRuntime.activeCaseId,
        title: 'Договор и переписка',
        documentIds: [if (documentId != null) documentId!],
      );
      setState(
          () => status = 'Папка доказательств создана: ${id.substring(0, 8)}');
    } catch (error) {
      setState(() => status = 'Evidence API ошибка: $error');
    }
  }

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
              'Проверка документов',
              style: Theme.of(context)
                  .textTheme
                  .headlineMedium
                  ?.copyWith(color: AppColors.goldDark),
            ),
            const SizedBox(height: 16),
            const _ReadinessCard(),
            const SizedBox(height: 12),
            _MissingDocsCard(onConfirmPresent: confirmOcr),
            const SizedBox(height: 12),
            _DocumentHint(
              text:
                  'Для подготовки иска желательно добавить недостающие документы.',
              trailing: status,
            ),
            const SizedBox(height: 16),
            const _UploadHero(),
            const SizedBox(height: 12),
            _UploadOptionGrid(
              busy: busy,
              uploaded: uploaded,
              onUpload: uploadDocument,
              onScan: () => setState(() {
                scanned = true;
                status =
                    'Сканирование камеры требует camera adapter; используйте загрузку файла';
              }),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () => setState(() {
                scanned = true;
                status =
                    'Сканирование камеры требует camera adapter; используйте загрузку файла';
              }),
              icon: const Icon(Icons.document_scanner_outlined),
              label: Text(scanned ? 'Скан готов' : 'Сканировать документ'),
            ),
            const SizedBox(height: 16),
            Text('Недавние загрузки',
                style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            const _RecentDocumentTile(
                title: 'Свидетельство_о_браке.pdf',
                subtitle: 'PDF · 1.2 МБ · 15 мая 2024'),
            const _RecentDocumentTile(
                title: 'Справка_о_доходах.jpg',
                subtitle: 'JPG · 0.8 МБ · 14 мая 2024'),
            const SizedBox(height: 12),
            _OcrReviewCard(
              confirmed: confirmed,
              onConfirm: confirmOcr,
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: () => context.go('/documents/analysis'),
              icon: const Icon(Icons.analytics_outlined),
              label: const Text('Анализировать документы'),
            ),
            const SizedBox(height: 12),
            _EvidenceCard(
              onTap: createEvidence,
            ),
          ],
        ),
      ),
    );
  }
}

class PickedDocumentFile {
  const PickedDocumentFile({
    required this.name,
    required this.path,
    required this.sizeBytes,
    required this.mimeType,
    required this.sha256,
  });

  final String name;
  final String path;
  final int sizeBytes;
  final String mimeType;
  final String sha256;
}

class UploadedDocumentResult {
  const UploadedDocumentResult({required this.id, required this.fileName});

  final String id;
  final String fileName;
}

abstract class DocumentFilePickerPort {
  Future<PickedDocumentFile?> pick();
}

abstract class DocumentApiPort {
  Future<UploadedDocumentResult> uploadMetadata({
    required String caseId,
    required PickedDocumentFile file,
  });

  Future<void> confirmOcr(String documentId, Map<String, String> fields);

  Future<String> createEvidence({
    required String caseId,
    required String title,
    required List<String> documentIds,
  });
}

class NativeDocumentFilePicker implements DocumentFilePickerPort {
  @override
  Future<PickedDocumentFile?> pick() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: [
        'pdf',
        'doc',
        'docx',
        'jpg',
        'jpeg',
        'png',
        'heic',
        'xlsx'
      ],
    );
    final file = result?.files.single;
    final path = file?.path;
    if (file == null || path == null) return null;
    final bytes = await File(path).readAsBytes();
    return PickedDocumentFile(
      name: file.name,
      path: path,
      sizeBytes: file.size,
      mimeType: _mimeTypeFor(file.name),
      sha256: sha256.convert(bytes).toString(),
    );
  }
}

class HttpDocumentApi implements DocumentApiPort {
  HttpDocumentApi({
    this.baseUrl = const String.fromEnvironment(
      'API_BASE_URL',
      defaultValue: 'https://89-207-250-217.sslip.io',
    ),
  });

  final String baseUrl;

  @override
  Future<UploadedDocumentResult> uploadMetadata({
    required String caseId,
    required PickedDocumentFile file,
  }) async {
    final session = await _postJson(ApiContract.filesUploadSessions, {
      'caseId': caseId,
      'fileName': file.name,
      'mimeType': file.mimeType,
      'sizeBytes': file.sizeBytes,
    });
    final document = await _postJson(ApiContract.filesComplete, {
      'uploadSessionId': session['id'],
      'sha256': file.sha256,
    });
    return UploadedDocumentResult(
      id: document['id'] as String,
      fileName: document['fileName'] as String,
    );
  }

  @override
  Future<void> confirmOcr(String documentId, Map<String, String> fields) async {
    final path = ApiContract.documentsDocumentIdOcrConfirm
        .replaceFirst('{documentId}', documentId);
    await _postJson(path, {'fields': fields});
  }

  @override
  Future<String> createEvidence({
    required String caseId,
    required String title,
    required List<String> documentIds,
  }) async {
    final body = await _postJson(ApiContract.evidence, {
      'caseId': caseId,
      'title': title,
      'documentIds': documentIds,
    });
    return body['id'] as String;
  }

  Future<Map<String, dynamic>> _postJson(
      String path, Map<String, dynamic> payload) async {
    final response = await http.post(
      Uri.parse('$baseUrl${ApiContract.basePath}$path'),
      headers: {
        'content-type': 'application/json',
        'x-correlation-id': 'mobile-documents',
        'x-user-id': AuthRuntime.userId,
      },
      body: jsonEncode(payload),
    );
    final body = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw HttpException('${body['message'] ?? body['error'] ?? path}');
    }
    return body;
  }
}

String _mimeTypeFor(String fileName) {
  final ext = fileName.split('.').last.toLowerCase();
  return switch (ext) {
    'png' => 'image/png',
    'jpg' || 'jpeg' => 'image/jpeg',
    'doc' => 'application/msword',
    'docx' =>
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xlsx' =>
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'heic' => 'image/heic',
    _ => 'application/pdf',
  };
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
    final progress = checked ? 1.0 : 0.82;
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
            const _AnalysisHero(),
            const SizedBox(height: 16),
            const _AnalysisTags(),
            const SizedBox(height: 16),
            const _AnalysisTimeline(),
            const SizedBox(height: 16),
            LinearProgressIndicator(value: progress),
            const SizedBox(height: 10),
            Text('Готовность анализа: ${(progress * 100).round()}%'),
            const SizedBox(height: 16),
            const _DocumentHint(
              text:
                  'Система нашла 4 документа, распознала 18 страниц и выделила ключевые сведения',
              trailing: '82%',
            ),
            FilledButton.icon(
              onPressed: () => setState(() => checked = true),
              icon: const Icon(Icons.check_outlined),
              label: Text(checked ? 'Анализ завершен' : 'Подтвердить анализ'),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed:
                  checked ? () => context.go('/workflow/pretrial-claim') : null,
              icon: const Icon(Icons.article_outlined),
              label: const Text('Сформировать претензию'),
            ),
          ],
        ),
      ),
    );
  }
}

class _ReadinessCard extends StatelessWidget {
  const _ReadinessCard();

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Row(
          children: [
            const _RoundGoldIcon(Icons.balance_outlined),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Готовность дела: 68%',
                      style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 10),
                  const LinearProgressIndicator(value: 0.68),
                  const SizedBox(height: 10),
                  const Text(
                    'Чем выше готовность, тем больше шансов на успешный исход дела.',
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MissingDocsCard extends StatelessWidget {
  const _MissingDocsCard({required this.onConfirmPresent});

  final VoidCallback onConfirmPresent;

  @override
  Widget build(BuildContext context) {
    final items = [
      ('Удостоверение личности', true),
      ('Свидетельство о браке', true),
      ('Свидетельство о рождении ребенка', false),
      ('Справка о доходах', false),
    ];
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Не хватает документов',
                style: Theme.of(context)
                    .textTheme
                    .titleLarge
                    ?.copyWith(color: AppColors.goldDark)),
            const SizedBox(height: 10),
            for (final item in items)
              ListTile(
                dense: true,
                contentPadding: EdgeInsets.zero,
                leading: Icon(
                  item.$2
                      ? Icons.check_circle_outline
                      : Icons.radio_button_unchecked,
                  color: item.$2 ? AppColors.gold : Theme.of(context).hintColor,
                ),
                title: Text(item.$1),
                trailing: Text(item.$2 ? 'Есть' : 'Отсутствует'),
                onTap: item.$2 ? onConfirmPresent : null,
              ),
          ],
        ),
      ),
    );
  }
}

class _UploadHero extends StatelessWidget {
  const _UploadHero();

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 26),
        child: Column(
          children: [
            const _RoundGoldIcon(Icons.description_outlined, size: 76),
            const SizedBox(height: 14),
            Text('Добавьте документ',
                style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 8),
            const Text(
              'Загрузите файл любым удобным способом для анализа и консультации',
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _UploadOptionGrid extends StatelessWidget {
  const _UploadOptionGrid({
    required this.busy,
    required this.uploaded,
    required this.onUpload,
    required this.onScan,
  });

  final bool busy;
  final bool uploaded;
  final VoidCallback onUpload;
  final VoidCallback onScan;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        FilledButton.icon(
          onPressed: busy ? null : onUpload,
          icon: const Icon(Icons.upload_file_outlined),
          label: Text(busy
              ? 'Обработка'
              : uploaded
                  ? 'Файл добавлен'
                  : 'Загрузить файл'),
        ),
        const SizedBox(height: 10),
        OutlinedButton.icon(
          onPressed: onScan,
          icon: const Icon(Icons.camera_alt_outlined),
          label: const Text('Сканировать камерой'),
        ),
        const SizedBox(height: 10),
        OutlinedButton.icon(
          onPressed: onScan,
          icon: const Icon(Icons.photo_camera_outlined),
          label: const Text('Сделать фото'),
        ),
      ],
    );
  }
}

class _RecentDocumentTile extends StatelessWidget {
  const _RecentDocumentTile({required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading:
            const Icon(Icons.insert_drive_file_outlined, color: AppColors.gold),
        title: Text(title),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.more_vert),
      ),
    );
  }
}

class _AnalysisHero extends StatelessWidget {
  const _AnalysisHero();

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Row(
          children: [
            const _RoundGoldIcon(Icons.auto_awesome_outlined),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Документы анализируются',
                      style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 8),
                  const Text(
                      'Извлекаем сведения из ваших файлов с помощью искусственного интеллекта'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AnalysisTags extends StatelessWidget {
  const _AnalysisTags();

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: const [
        Chip(label: Text('ФИО')),
        Chip(label: Text('Даты')),
        Chip(label: Text('Суммы')),
        Chip(label: Text('ИИН')),
        Chip(label: Text('Статьи')),
        Chip(label: Text('Приложения')),
      ],
    );
  }
}

class _AnalysisTimeline extends StatelessWidget {
  const _AnalysisTimeline();

  @override
  Widget build(BuildContext context) {
    final steps = [
      ('OCR завершен', 'Завершено', Icons.check_circle_outline),
      ('Тип документа определен', 'Завершено', Icons.check_circle_outline),
      ('Проверка реквизитов', 'В процессе', Icons.radio_button_checked),
      ('Поиск норм права', 'Ожидает', Icons.radio_button_unchecked),
    ];
    return Card(
      child: Column(
        children: [
          for (final step in steps)
            ListTile(
              leading: Icon(step.$3, color: AppColors.gold),
              title: Text(step.$1),
              trailing: Text(step.$2),
            ),
        ],
      ),
    );
  }
}

class _DocumentHint extends StatelessWidget {
  const _DocumentHint({required this.text, required this.trailing});

  final String text;
  final String trailing;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(Icons.info_outline, color: AppColors.gold),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(text),
                  const SizedBox(height: 8),
                  Text(
                    trailing,
                    style: Theme.of(context)
                        .textTheme
                        .titleMedium
                        ?.copyWith(color: AppColors.goldDark),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RoundGoldIcon extends StatelessWidget {
  const _RoundGoldIcon(this.icon, {this.size = 56});

  final IconData icon;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: AppColors.gold.withValues(alpha: 0.14),
        border: Border.all(color: AppColors.gold.withValues(alpha: 0.45)),
      ),
      child: Icon(icon, color: AppColors.gold, size: size * 0.46),
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
