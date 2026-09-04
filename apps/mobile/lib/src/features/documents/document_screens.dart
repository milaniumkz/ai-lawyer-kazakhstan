import 'dart:convert';
import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;

import '../../api/api_contract.dart';
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
              'Загрузка документов',
              style: Theme.of(context)
                  .textTheme
                  .headlineMedium
                  ?.copyWith(color: AppColors.goldDark),
            ),
            const SizedBox(height: 16),
            Text(status),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: busy ? null : uploadDocument,
              icon: const Icon(Icons.upload_file_outlined),
              label: Text(busy
                  ? 'Обработка'
                  : uploaded
                      ? 'Файл добавлен'
                      : 'Загрузить файл'),
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
      headers: const {
        'content-type': 'application/json',
        'x-correlation-id': 'mobile-documents',
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
