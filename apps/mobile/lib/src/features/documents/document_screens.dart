import '../../widgets/mounted_state.dart';
import 'dart:convert';
import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:file_picker/file_picker.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../api/session_http.dart' as http;
import 'package:http_parser/http_parser.dart';

import '../../api/api_contract.dart';
import '../auth/auth_screens.dart';
import '../cases/case_screens.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_bottom_nav.dart';
import '../../widgets/aizan_design.dart';

class DocumentsScreen extends StatefulWidget {
  const DocumentsScreen(
      {super.key,
      this.filePicker,
      this.documentApi,
      this.addMode = false,
      this.openCamera = false});

  final DocumentFilePickerPort? filePicker;
  final DocumentApiPort? documentApi;
  final bool addMode;
  final bool openCamera;

  @override
  State<DocumentsScreen> createState() => _DocumentsScreenState();
}

class _DocumentsScreenState extends State<DocumentsScreen>
    with MountedState<DocumentsScreen> {
  late final DocumentFilePickerPort filePicker;
  late final DocumentApiPort documentApi;
  var uploaded = false;
  var selectedTab = 0;
  final searchController = TextEditingController();
  var confirmed = false;
  var busy = false;
  var status = 'Выберите файл для загрузки';
  String? documentId;
  final documentTitleController = TextEditingController();
  final documentDetailsController = TextEditingController();

  @override
  void initState() {
    super.initState();
    filePicker = widget.filePicker ?? NativeDocumentFilePicker();
    documentApi = widget.documentApi ?? HttpDocumentApi();
    if (widget.openCamera) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) uploadDocument(camera: true);
      });
    }
    if (!widget.addMode &&
        MobileCaseRuntime.activeCaseId.isNotEmpty &&
        AuthRuntime.userId.isNotEmpty) {
      loadDocuments();
    }
  }

  Future<void> loadDocuments() async {
    final api = documentApi;
    if (api is! HttpDocumentApi) return;
    try {
      final caseId = MobileCaseRuntime.activeCaseId;
      final files = await api.listDocuments(caseId);
      if (!mounted || caseId != MobileCaseRuntime.activeCaseId) return;
      updateState(() {
        DocumentRuntime.documents
          ..clear()
          ..addAll(files);
        status = files.isEmpty
            ? 'Документов в деле пока нет'
            : 'Документы загружены';
      });
    } catch (error) {
      if (mounted) {
        updateState(() => status = 'Не удалось получить документы: $error');
      }
    }
  }

  Future<void> uploadDocument({bool camera = false}) async {
    if (busy) return;
    final caseId = MobileCaseRuntime.activeCaseId;
    if (caseId.isEmpty) {
      updateState(
          () => status = 'Сначала создайте дело, затем загрузите документ');
      return;
    }
    updateState(() {
      busy = true;
      status = 'Открываю выбор файла...';
    });
    try {
      final picker = filePicker;
      final file = camera && picker is NativeDocumentFilePicker
          ? await picker.pickCamera()
          : await picker.pick();
      if (!mounted || caseId != MobileCaseRuntime.activeCaseId) return;
      if (file == null) {
        updateState(() => status = 'Выбор файла отменен');
        return;
      }
      if (MobileCaseRuntime.activeCaseId.isEmpty) {
        updateState(
            () => status = 'Сначала создайте дело, затем загрузите документ');
        return;
      }
      if (file.sizeBytes > 25 * 1024 * 1024) {
        updateState(() => status = 'Размер файла должен быть не более 25 МБ');
        return;
      }
      final saved = await documentApi.uploadMetadata(
        caseId: caseId,
        file: file,
      );
      if (!mounted || caseId != MobileCaseRuntime.activeCaseId) return;
      updateState(() {
        uploaded = true;
        DocumentRuntime.documents.add(saved);
        documentId = saved.id;
        documentTitleController.text = saved.fileName;
        status =
            'Файл сохранён: ${saved.fileName}. Автоматический OCR пока недоступен — проверьте поля вручную.';
      });
    } catch (error) {
      updateState(() => status = 'Документ API ошибка: $error');
    } finally {
      if (mounted) updateState(() => busy = false);
    }
  }

  Future<void> confirmOcr() async {
    if (busy) return;
    if (documentId == null) {
      updateState(() => status = 'Сначала загрузите документ');
      return;
    }
    updateState(() => busy = true);
    try {
      await documentApi.confirmOcr(documentId!, {
        'documentTitle': documentTitleController.text.trim(),
        'details': documentDetailsController.text.trim(),
        'reviewRequired': 'false',
      });
      updateState(() {
        confirmed = true;
        DocumentRuntime.confirmedIds.add(documentId!);
        status = 'Поля подтверждены через API';
      });
    } catch (error) {
      updateState(() => status = 'OCR API ошибка: $error');
    } finally {
      if (mounted) updateState(() => busy = false);
    }
  }

  @override
  void dispose() {
    searchController.dispose();
    documentTitleController.dispose();
    documentDetailsController.dispose();
    super.dispose();
  }

  void cameraUnavailable() {
    uploadDocument(camera: true);
  }

  @override
  Widget build(BuildContext context) {
    final files = DocumentRuntime.documents
        .where((file) => file.fileName
            .toLowerCase()
            .contains(searchController.text.toLowerCase()))
        .toList();
    return Scaffold(
      appBar: AizanHeader(compact: widget.addMode),
      bottomNavigationBar:
          widget.addMode ? null : const AppBottomNav(selectedIndex: 2),
      body: Center(
          child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 480),
        child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 28),
            children: [
              if (widget.addMode) ...[
                const AizanArt(AizanArtwork.upload, width: 200),
                const SizedBox(height: 14),
                Text('Добавьте документ',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.headlineMedium),
                const SizedBox(height: 12),
                const Text(
                    'Загрузите файл любым удобным способом для анализа и консультации',
                    textAlign: TextAlign.center),
                const SizedBox(height: 22),
                _UploadOptionGrid(
                    busy: busy,
                    uploaded: uploaded,
                    onUpload: uploadDocument,
                    onScan: cameraUnavailable),
                const SizedBox(height: 22),
                Text('Недавние загрузки',
                    style: Theme.of(context).textTheme.titleLarge),
              ] else ...[
                Text('Документы и доказательства',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.headlineSmall),
                const SizedBox(height: 20),
                Row(
                    children: List.generate(
                        4,
                        (index) => Expanded(
                                child: TextButton(
                              onPressed: () =>
                                  updateState(() => selectedTab = index),
                              style: TextButton.styleFrom(
                                  foregroundColor: selectedTab == index
                                      ? AizanDesign.gold
                                      : Colors.white70),
                              child: Text(
                                  [
                                    'Все',
                                    'По делу',
                                    'Шаблоны',
                                    'Загруженные'
                                  ][index],
                                  style: const TextStyle(fontSize: 11)),
                            )))),
                TextField(
                    controller: searchController,
                    onChanged: (_) => updateState(() {}),
                    decoration: const InputDecoration(
                        prefixIcon: Icon(Icons.search),
                        hintText: 'Поиск по документам')),
                const SizedBox(height: 18),
              ],
              if (selectedTab == 2 && !widget.addMode)
                const Padding(
                    padding: EdgeInsets.all(20),
                    child: Text(
                        'Готовые шаблоны появятся после подключения каталога.'))
              else if (files.isEmpty)
                const Padding(
                    padding: EdgeInsets.symmetric(vertical: 20),
                    child: Text(
                        'Документов пока нет. Добавьте файл по вашему делу.'))
              else
                ...files.map((file) => _RecentDocumentTile(
                    title: file.fileName,
                    subtitle: DocumentRuntime.confirmedIds.contains(file.id)
                        ? 'Поля подтверждены'
                        : 'Требуется проверка')),
              const SizedBox(height: 18),
              Text(status,
                  style: const TextStyle(fontSize: 12, color: Colors.white70)),
              const SizedBox(height: 16),
              if (!widget.addMode)
                AizanButton(
                    label: 'Добавить документ',
                    icon: Icons.upload_file_outlined,
                    onPressed: () => context.go('/documents/add'))
              else ...[
                const Text('PDF, DOCX, JPG, PNG · до 25 МБ',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 11)),
                const SizedBox(height: 16),
                if (uploaded)
                  Card(
                      child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(children: [
                            const Text('Проверьте сведения вручную'),
                            const SizedBox(height: 12),
                            TextField(
                                controller: documentTitleController,
                                decoration: const InputDecoration(
                                    labelText: 'Название документа')),
                            const SizedBox(height: 12),
                            TextField(
                                controller: documentDetailsController,
                                decoration: const InputDecoration(
                                    labelText: 'Сумма / реквизиты')),
                            const SizedBox(height: 12),
                            OutlinedButton(
                                onPressed: busy ? null : confirmOcr,
                                child: Text(confirmed
                                    ? 'Поля подтверждены'
                                    : 'Подтвердить поля')),
                          ]))),
                const SizedBox(height: 12),
                AizanButton(
                    label: 'Продолжить',
                    onPressed: uploaded
                        ? () => context.go('/documents/analysis')
                        : null),
              ],
            ]),
      )),
    );
  }
}

abstract final class DocumentRuntime {
  static final documents = <UploadedDocumentResult>[];
  static final confirmedIds = <String>{};
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
  Future<PickedDocumentFile?> pickCamera() async {
    final image = await ImagePicker()
        .pickImage(source: ImageSource.camera, imageQuality: 90);
    if (image == null) return null;
    if (await image.length() > 25 * 1024 * 1024) {
      throw const HttpException('Размер файла должен быть не более 25 МБ');
    }
    final bytes = await image.readAsBytes();
    return PickedDocumentFile(
        name: image.name,
        path: image.path,
        sizeBytes: bytes.length,
        mimeType: _mimeTypeFor(image.name),
        sha256: sha256.convert(bytes).toString());
  }

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
    if (file.size > 25 * 1024 * 1024) {
      throw const HttpException('Размер файла должен быть не более 25 МБ');
    }
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

  Future<List<UploadedDocumentResult>> listDocuments(String caseId) async {
    final response = await http.get(
        Uri.parse('$baseUrl${ApiContract.basePath}/cases/$caseId/documents'),
        headers: {'x-user-id': AuthRuntime.userId});
    if (response.statusCode != 200) {
      throw HttpException('Documents API: ${response.statusCode}');
    }
    return (jsonDecode(response.body) as List<dynamic>).map((value) {
      final item = value as Map<String, dynamic>;
      return UploadedDocumentResult(
          id: item['id'] as String, fileName: item['fileName'] as String);
    }).toList();
  }

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
    final upload = http.MultipartRequest('POST',
        Uri.parse('$baseUrl${ApiContract.basePath}${session['uploadUrl']}'));
    upload.headers.addAll({
      'x-user-id': AuthRuntime.userId,
      'x-upload-session-id': session['id'] as String
    });
    final bytes = await File(file.path).readAsBytes();
    upload.files.add(http.MultipartFile.fromBytes('file', bytes,
        filename: file.name, contentType: MediaType.parse(file.mimeType)));
    final uploaded = await upload.send().timeout(const Duration(seconds: 60));
    await uploaded.stream.drain<void>();
    if (uploaded.statusCode != 201) {
      throw HttpException('File upload failed: ${uploaded.statusCode}');
    }
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

class _DocumentAnalysisScreenState extends State<DocumentAnalysisScreen>
    with MountedState<DocumentAnalysisScreen> {
  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: const AizanHeader(compact: true),
        body: Center(
            child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: ListView(padding: const EdgeInsets.all(20), children: [
            const AizanArt(AizanArtwork.analysis, width: 210),
            const SizedBox(height: 16),
            Text('Анализ документов',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineMedium),
            const SizedBox(height: 12),
            const Text(
                'Проверьте сведения из ваших файлов перед подготовкой документа',
                textAlign: TextAlign.center),
            const SizedBox(height: 20),
            const _AnalysisTags(),
            const SizedBox(height: 20),
            ...[
              ('Документы добавлены', DocumentRuntime.documents.isNotEmpty),
              (
                'Поля подтверждены пользователем',
                DocumentRuntime.confirmedIds.isNotEmpty
              ),
              ('Проверка реквизитов', false),
              ('Поиск норм права', false),
            ].map((step) => ListTile(
                leading: Icon(
                    step.$2
                        ? Icons.check_circle_outline
                        : Icons.radio_button_unchecked,
                    color: AizanDesign.gold),
                title: Text(step.$1),
                subtitle: Text(step.$2 ? 'Подтверждено' : 'Ожидает проверки'))),
            const SizedBox(height: 20),
            _DocumentHint(
                text:
                    'Добавлено документов: ${DocumentRuntime.documents.length}. Автоматический юридический анализ не выполнен.',
                trailing: 'Проверка'),
            const SizedBox(height: 16),
            AizanButton(
                label: 'Продолжить',
                onPressed: DocumentRuntime.confirmedIds.isNotEmpty
                    ? () => context.go('/workflow/pretrial-claim')
                    : null),
            const SizedBox(height: 12),
            OutlinedButton(
                onPressed: () => context.go('/documents/add'),
                child: const Text('Посмотреть детали')),
          ]),
        )),
      );
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
