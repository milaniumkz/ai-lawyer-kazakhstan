import '../../api/session_credentials.dart';
import '../../widgets/mounted_state.dart';
import 'package:crypto/crypto.dart';
import '../../api/draft_store.dart';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../api/session_http.dart' as http;

import '../../api/api_contract.dart';
import '../cases/case_screens.dart';
import '../auth/auth_screens.dart';
import '../../widgets/aizan_design.dart';
import 'document_export.dart';
import '../../theme/app_theme.dart';

class PretrialClaimScreen extends StatefulWidget {
  const PretrialClaimScreen({super.key, this.workflowApi});

  final WorkflowApiPort? workflowApi;

  @override
  State<PretrialClaimScreen> createState() => _PretrialClaimScreenState();
}

class _PretrialClaimScreenState extends State<PretrialClaimScreen>
    with MountedState<PretrialClaimScreen> {
  late final WorkflowApiPort workflowApi;
  late final TextEditingController claimantController;
  late final TextEditingController respondentController;
  late final TextEditingController amountController;
  late final TextEditingController reasonController;
  var generated = false;
  var busy = false;
  var status = 'Заполните данные претензии';

  @override
  void initState() {
    super.initState();
    workflowApi = widget.workflowApi ?? HttpWorkflowApi();
    claimantController = TextEditingController(text: AuthRuntime.displayName);
    respondentController = TextEditingController();
    amountController = TextEditingController();
    final form = DraftStore.values['claimForm'] as Map<String, dynamic>?;
    respondentController.text = form?['respondent'] as String? ?? '';
    amountController.text = form?['amount'] as String? ??
        MobileCaseRuntime.draftClassification?.facts['amount'] as String? ??
        '';
    reasonController = TextEditingController(
        text: form?['reason'] as String? ?? MobileCaseRuntime.confirmedText);
    for (final controller in [
      claimantController,
      respondentController,
      amountController,
      reasonController
    ]) {
      controller.addListener(() => DraftStore.put('claimForm', {
            'respondent': respondentController.text,
            'amount': amountController.text,
            'reason': reasonController.text
          }));
    }
    if (workflowApi is HttpWorkflowApi &&
        SessionCredentials.token.isNotEmpty &&
        MobileCaseRuntime.activeCaseId.isNotEmpty &&
        WorkflowRuntime.generationJobId.isEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) => restoreCaseDraft());
    }
    if (WorkflowRuntime.generationJobId.isNotEmpty &&
        workflowApi is HttpWorkflowApi) {
      WidgetsBinding.instance.addPostFrameCallback((_) => resumeGeneration());
    }
  }

  @override
  void dispose() {
    claimantController.dispose();
    respondentController.dispose();
    amountController.dispose();
    reasonController.dispose();
    super.dispose();
  }

  Future<void> restoreCaseDraft() async {
    updateState(() => busy = true);
    final caseId = MobileCaseRuntime.activeCaseId;
    final origin = (workflowApi as HttpWorkflowApi).baseUrl;
    try {
      final classification = await http
          .get(Uri.parse('$origin/api/v1/cases/$caseId/classification'));
      if (!mounted || caseId != MobileCaseRuntime.activeCaseId) return;
      if (classification.statusCode == 200) {
        final result = classificationFromResponse(classification);
        MobileCaseRuntime.draftClassification = result;
        MobileCaseRuntime.confirmedClassificationId = result.id;
        if (amountController.text.isEmpty) {
          amountController.text = result.facts['amount'] as String? ?? '';
        }
        await MobileCaseRuntime.persist();
      } else if (classification.statusCode != 404) {
        throw const HttpException('Не удалось восстановить данные дела');
      }
      final drafts = await http
          .get(Uri.parse('$origin/api/v1/cases/$caseId/generated-documents'));
      if (drafts.statusCode != 200) {
        throw const HttpException('Не удалось загрузить проекты');
      }
      final records = jsonDecode(drafts.body) as List;
      if (!mounted || caseId != MobileCaseRuntime.activeCaseId) return;
      if (records.isNotEmpty && WorkflowRuntime.generatedId.isEmpty) {
        WorkflowRuntime.generatedId = records.first['id'] as String;
        WorkflowRuntime.generatedBody = records.first['body'] as String;
        await WorkflowRuntime.persist();
        updateState(() => generated = true);
      }
      final jobs = await http
          .get(Uri.parse('$origin/api/v1/cases/$caseId/generation-jobs'));
      if (jobs.statusCode != 200) {
        throw const HttpException('Не удалось восстановить подготовку');
      }
      final pending = (jsonDecode(jobs.body) as List)
          .where(
              (job) => job['status'] == 'queued' || job['status'] == 'running')
          .firstOrNull;
      if (pending != null) {
        WorkflowRuntime.generationJobId = pending['id'] as String;
        await WorkflowRuntime.persist();
        updateState(() => busy = false);
        await resumeGeneration();
      }
    } catch (error) {
      updateState(() => status = '$error');
    } finally {
      updateState(() => busy = false);
    }
  }

  Future<void> resumeGeneration() async {
    if (busy || workflowApi is! HttpWorkflowApi) return;
    updateState(() {
      busy = true;
      status = 'Восстанавливаю серверную задачу';
    });
    try {
      final result = await (workflowApi as HttpWorkflowApi).resumeJob();
      if (!mounted) return;
      updateState(() {
        generated = true;
        status = 'Проект сохранён';
      });
      WorkflowRuntime.generatedBody = result.body;
      context.go('/workflow/pretrial-claim/draft');
    } catch (error) {
      if (mounted) updateState(() => status = '$error');
    } finally {
      if (mounted) updateState(() => busy = false);
    }
  }

  Future<void> cancelGeneration() async {
    if (workflowApi is! HttpWorkflowApi) return;
    try {
      await (workflowApi as HttpWorkflowApi).cancelJob();
    } catch (error) {
      if (mounted) updateState(() => status = '$error');
    }
  }

  Future<void> generateDraft() async {
    if (busy) return;
    if (MobileCaseRuntime.activeCaseId.isEmpty) {
      updateState(() => status = 'Сначала создайте дело');
      return;
    }
    if (claimantController.text.trim().isEmpty ||
        respondentController.text.trim().isEmpty ||
        amountController.text.trim().isEmpty ||
        reasonController.text.trim().isEmpty) {
      updateState(
          () => status = 'Заполните заявителя, ответчика, сумму и основание');
      return;
    }
    updateState(() {
      busy = true;
      status = 'Формирую проект через API...';
    });
    try {
      final draft = await workflowApi.generateClaim(
        caseId: MobileCaseRuntime.activeCaseId,
        claimantName: claimantController.text.trim(),
        respondentName: respondentController.text.trim(),
        claimAmount: amountController.text.trim(),
        claimReason: reasonController.text.trim(),
      );
      if (!mounted) return;
      WorkflowRuntime.generatedBody = draft.body;
      WorkflowRuntime.generatedId = draft.id;
      await WorkflowRuntime.persist();
      updateState(() {
        generated = true;
        status = 'Проект сформирован: ${draft.id.substring(0, 8)}';
      });
      if (mounted) context.go('/workflow/pretrial-claim/draft');
    } catch (error) {
      if (mounted) updateState(() => status = 'Генерация API ошибка: $error');
    } finally {
      if (mounted) updateState(() => busy = false);
    }
  }

  double progressValue() =>
      workflowStages().where((step) => step.done).length /
      workflowStages().length;

  bool get hasRequiredFields =>
      claimantController.text.trim().isNotEmpty &&
      respondentController.text.trim().isNotEmpty &&
      amountController.text.trim().isNotEmpty &&
      reasonController.text.trim().isNotEmpty;

  List<({String title, bool done})> workflowStages() => [
        (
          title: '1. Дело',
          done: MobileCaseRuntime.activeCaseId.isNotEmpty,
        ),
        (title: '2. Данные', done: hasRequiredFields),
        (
          title: '3. Нормы',
          done: false,
        ),
        (title: '4. Проект', done: generated),
        (title: '5. Проверка', done: false),
      ];

  String aiStepText() {
    if (MobileCaseRuntime.activeCaseId.isEmpty) {
      return 'Сначала создайте дело в базе. Претензия не формируется без реального caseId.';
    }
    if (busy) return 'Формирую проект через API и проверяю обязательные поля.';
    if (!hasRequiredFields) {
      return 'Заполните стороны, сумму и основание. Я не буду подставлять выдуманные данные.';
    }
    if (!generated) {
      return 'Данные готовы. Нажмите “Открыть проект”, чтобы создать черновик через API.';
    }
    return 'Проект создан. Перед отправкой нужна проверка пользователя и при необходимости юриста.';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const AizanHeader(compact: true),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Text(
              'Формирование претензии',
              style: Theme.of(context)
                  .textTheme
                  .headlineMedium
                  ?.copyWith(color: AppColors.goldDark),
            ),
            const SizedBox(height: 16),
            const _ClaimBuildHero(),
            const SizedBox(height: 12),
            _ClaimProgressCard(
              progress: progressValue(),
              subtitle: status,
            ),
            const SizedBox(height: 12),
            _ClaimStageRail(items: workflowStages()),
            const SizedBox(height: 12),
            _ClaimAiChat(status: aiStepText(), generated: generated),
            const SizedBox(height: 12),
            _ClaimSteps(
              onGenerate: generateDraft,
              generated: generated,
              hasRequiredFields: hasRequiredFields,
            ),
            const SizedBox(height: 12),
            const _ClaimBasisCard(),
            const SizedBox(height: 16),
            TextField(
                controller: claimantController,
                onChanged: (_) => updateState(() {}),
                decoration: InputDecoration(labelText: 'Заявитель')),
            const SizedBox(height: 12),
            TextField(
                controller: respondentController,
                onChanged: (_) => updateState(() {}),
                decoration: const InputDecoration(labelText: 'Ответчик')),
            const SizedBox(height: 12),
            TextField(
              controller: amountController,
              onChanged: (_) => updateState(() {}),
              keyboardType: TextInputType.number,
              decoration:
                  const InputDecoration(labelText: 'Сумма требования, ₸'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: reasonController,
              onChanged: (_) => updateState(() {}),
              minLines: 3,
              maxLines: 5,
              decoration:
                  const InputDecoration(labelText: 'Основание требования'),
            ),
            const SizedBox(height: 16),
            Text(status),
            const SizedBox(height: 12),
            if (WorkflowRuntime.generatedId.isNotEmpty)
              OutlinedButton(
                  onPressed: busy
                      ? null
                      : () => context.go('/workflow/pretrial-claim/draft'),
                  child: const Text('Открыть сохранённый проект')),
            if (busy && workflowApi is HttpWorkflowApi)
              TextButton(
                  onPressed: cancelGeneration,
                  child: const Text('Отменить подготовку')),
            FilledButton.icon(
              onPressed: busy
                  ? null
                  : WorkflowRuntime.generationJobId.isNotEmpty
                      ? resumeGeneration
                      : generateDraft,
              icon: const Icon(Icons.article_outlined),
              label: Text(busy
                  ? 'Формирую'
                  : generated
                      ? 'Проект сформирован'
                      : 'Открыть проект'),
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

class _ClaimDraftScreenState extends State<ClaimDraftScreen>
    with MountedState<ClaimDraftScreen> {
  var approved = false;
  late final TextEditingController bodyController;
  final bodyFocus = FocusNode();
  @override
  void initState() {
    super.initState();
    bodyController = TextEditingController(text: WorkflowRuntime.generatedBody);
  }

  @override
  void dispose() {
    bodyController.dispose();
    bodyFocus.dispose();
    super.dispose();
  }

  Future<void> exportPdf() async {
    try {
      await exportClaimPdf(bodyController.text);
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Не удалось создать PDF: $error')));
      }
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: const AizanHeader(compact: true),
        body: Center(
            child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: ListView(padding: const EdgeInsets.all(20), children: [
            Text('Предпросмотр документа',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 16),
            const _ClaimStatusChips(),
            const SizedBox(height: 18),
            Card(
                color: const Color(0xFFF4EDDE),
                child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(children: [
                      const Icon(Icons.balance_outlined,
                          color: Color(0xFF9C6F21), size: 44),
                      const SizedBox(height: 14),
                      const Text('Досудебная претензия',
                          style: TextStyle(
                              fontFamily: 'AizanSerif',
                              fontSize: 24,
                              color: Color(0xFF3C2A0F))),
                      TextField(
                          controller: bodyController,
                          focusNode: bodyFocus,
                          minLines: 12,
                          maxLines: null,
                          style: const TextStyle(
                              color: Color(0xFF332513),
                              fontFamily: 'AizanSerif',
                              height: 1.5),
                          decoration: const InputDecoration(
                              fillColor: Colors.transparent,
                              hintText: 'Сначала сформируйте проект'),
                          onChanged: (value) => updateState(() {
                                WorkflowRuntime.generatedBody = value;
                                WorkflowRuntime.persist();
                                approved = false;
                              })),
                    ]))),
            const SizedBox(height: 14),
            Row(children: [
              Expanded(
                  child: OutlinedButton.icon(
                      onPressed: bodyFocus.requestFocus,
                      icon: const Icon(Icons.edit_outlined),
                      label: const Text('Редактировать'))),
              const SizedBox(width: 8),
              Expanded(
                  child: OutlinedButton.icon(
                      onPressed:
                          bodyController.text.trim().isEmpty ? null : exportPdf,
                      icon: const Icon(Icons.picture_as_pdf_outlined),
                      label: const Text('Скачать PDF')))
            ]),
            TextButton(
                onPressed: () async {
                  try {
                    await HttpWorkflowApi().saveDraft(
                        WorkflowRuntime.generatedId, bodyController.text);
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                          content: Text('Проект сохранён на сервере')));
                    }
                  } catch (error) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context)
                          .showSnackBar(SnackBar(content: Text('$error')));
                    }
                  }
                },
                child: const Text('Сохранить проект')),
            CheckboxListTile(
                value: approved,
                onChanged: (value) =>
                    updateState(() => approved = value ?? false),
                title: const Text('Проверено пользователем')),
            AizanButton(
                label: 'Перейти к отправке',
                icon: Icons.send_outlined,
                onPressed: approved && bodyController.text.trim().isNotEmpty
                    ? () => context.go('/workflow/pretrial-claim/send')
                    : null),
          ]),
        )),
      );
}

class GeneratedClaimDraft {
  const GeneratedClaimDraft({required this.id, required this.body});

  final String id;
  final String body;
}

abstract class WorkflowApiPort {
  Future<GeneratedClaimDraft> generateClaim({
    required String caseId,
    required String claimantName,
    required String respondentName,
    required String claimAmount,
    required String claimReason,
  });
}

abstract final class WorkflowRuntime {
  static String generatedBody = '';
  static String generatedId = '';
  static String generationJobId = '';
  static Future<void> persist() => DraftStore.put('workflow', {
        'generatedBody': generatedBody,
        'generatedId': generatedId,
        'generationJobId': generationJobId
      });
  static void restore() {
    final raw = DraftStore.values['workflow'];
    final data = raw is Map<String, dynamic> ? raw : <String, dynamic>{};
    generatedBody =
        data['generatedBody'] is String ? data['generatedBody'] as String : '';
    generatedId =
        data['generatedId'] is String ? data['generatedId'] as String : '';
    generationJobId = data['generationJobId'] is String
        ? data['generationJobId'] as String
        : '';
  }
}

class HttpWorkflowApi implements WorkflowApiPort {
  HttpWorkflowApi({
    this.baseUrl = const String.fromEnvironment(
      'API_BASE_URL',
      defaultValue: 'https://89-207-250-217.sslip.io',
    ),
  });

  final String baseUrl;

  @override
  Future<GeneratedClaimDraft> generateClaim({
    required String caseId,
    required String claimantName,
    required String respondentName,
    required String claimAmount,
    required String claimReason,
  }) async {
    final templates = await http.get(
      Uri.parse('$baseUrl${ApiContract.basePath}${ApiContract.templates}'),
      headers: const {'x-correlation-id': 'mobile-workflow'},
    );
    if (templates.statusCode < 200 || templates.statusCode >= 300) {
      throw HttpException('templates failed: ${templates.statusCode}');
    }
    final templateList = jsonDecode(templates.body) as List<dynamic>;
    final candidates = templateList
        .cast<Map<String, dynamic>>()
        .where((item) =>
            item['code'] == 'pretrial_claim' && item['language'] == 'ru')
        .toList();
    final template =
        candidates.where((item) => item['version'] == 'v2').firstOrNull ??
            candidates.firstOrNull;
    if (template == null) {
      throw const HttpException('Нет доступного шаблона претензии');
    }
    final templateId = template['id'] as String;
    final input = {
      'templateId': templateId,
      'caseId': caseId,
      'fields': {
        'claimantName': claimantName,
        'respondentName': respondentName,
        'claimAmount': claimAmount,
        'claimReason': claimReason,
        'deadlineDate': 'Срок требует проверки и подтверждения пользователем',
      },
      'confirmedCitationIds': <String>[],
    };
    if (WorkflowRuntime.generationJobId.isEmpty) {
      final response = await http.post(
          Uri.parse(
              '$baseUrl${ApiContract.basePath}/documents/generation-jobs'),
          headers: {
            'content-type': 'application/json',
            'idempotency-key':
                sha256.convert(utf8.encode(jsonEncode(input))).toString()
          },
          body: jsonEncode(input));
      final job = jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw HttpException(
            '${job['message'] ?? 'Не удалось начать подготовку'}');
      }
      WorkflowRuntime.generationJobId = job['id'] as String;
      await WorkflowRuntime.persist();
    }
    return resumeJob();
  }

  Future<GeneratedClaimDraft> resumeJob() async {
    final id = WorkflowRuntime.generationJobId;
    if (id.isEmpty) throw const HttpException('Нет сохранённой задачи');
    for (var attempt = 0; attempt < 400; attempt++) {
      final response = await http.get(Uri.parse(
          '$baseUrl${ApiContract.basePath}/documents/generation-jobs/$id'));
      final job = jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode != 200) {
        throw HttpException(
            '${job['message'] ?? 'Не удалось получить задачу'}');
      }
      if (job['status'] == 'completed') {
        final document = job['document'] as Map<String, dynamic>;
        WorkflowRuntime.generatedId = document['id'] as String;
        WorkflowRuntime.generatedBody = document['body'] as String;
        WorkflowRuntime.generationJobId = '';
        await WorkflowRuntime.persist();
        return GeneratedClaimDraft(
            id: WorkflowRuntime.generatedId,
            body: WorkflowRuntime.generatedBody);
      }
      if (job['status'] == 'cancelled' || job['status'] == 'failed') {
        WorkflowRuntime.generationJobId = '';
        await WorkflowRuntime.persist();
        throw HttpException(job['status'] == 'cancelled'
            ? 'Подготовка отменена'
            : 'Ошибка подготовки. Повторите попытку.');
      }
      await Future<void>.delayed(const Duration(milliseconds: 750));
    }
    throw const HttpException(
        'Задача сохранена. Откройте подготовку снова, чтобы получить результат.');
  }

  Future<void> cancelJob() async {
    if (WorkflowRuntime.generationJobId.isEmpty) return;
    final response = await http.post(Uri.parse(
        '$baseUrl${ApiContract.basePath}/documents/generation-jobs/${WorkflowRuntime.generationJobId}/cancel'));
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw const HttpException('Не удалось отменить задачу');
    }
  }

  Future<void> saveDraft(String id, String body) async {
    if (id.isEmpty) throw const HttpException('Нет сохранённого проекта');
    final response = await http.patch(
        Uri.parse('$baseUrl${ApiContract.basePath}/generated-documents/$id'),
        headers: {'content-type': 'application/json'},
        body: jsonEncode({'body': body}));
    if (response.statusCode != 200) {
      throw const HttpException('Не удалось сохранить проект');
    }
  }
}

class ClaimSendScreen extends StatefulWidget {
  const ClaimSendScreen({super.key});

  @override
  State<ClaimSendScreen> createState() => _ClaimSendScreenState();
}

class _ClaimSendScreenState extends State<ClaimSendScreen>
    with MountedState<ClaimSendScreen> {
  var sent = false;
  var busy = false;
  var selectedMethod = 'WhatsApp';
  var status = 'Выберите канал и укажите контакт получателя';
  late final TextEditingController recipientController;
  var restoring = false;
  var hasLocalDraft = false;

  @override
  void initState() {
    super.initState();
    final raw = DraftStore.values['dispatch'];
    final data = raw is Map<String, dynamic> &&
            raw['documentId'] == WorkflowRuntime.generatedId
        ? raw
        : null;
    recipientController =
        TextEditingController(text: data?['contact'] as String? ?? '');
    selectedMethod = data?['method'] as String? ?? 'WhatsApp';
    sent = data?['sent'] == true;
    hasLocalDraft =
        data != null && !sent && recipientController.text.trim().isNotEmpty;
    if (sent) status = 'Ручная отправка записана. Доставка не подтверждена.';
    recipientController.addListener(() {
      if (!restoring) {
        sent = false;
        hasLocalDraft = true;
      }
      persistDispatch();
    });
    if (SessionCredentials.token.isNotEmpty &&
        WorkflowRuntime.generatedId.isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) => restoreDispatch());
    }
  }

  Future<void> persistDispatch() => DraftStore.put('dispatch', {
        'documentId': WorkflowRuntime.generatedId,
        'contact': recipientController.text,
        'method': selectedMethod,
        'sent': sent,
      });
  Future<void> restoreDispatch() async {
    if (!mounted || busy || WorkflowRuntime.generatedId.isEmpty) return;
    updateState(() => busy = true);
    final documentId = WorkflowRuntime.generatedId;
    try {
      final response = await http.get(Uri.parse(
          '${const String.fromEnvironment('API_BASE_URL', defaultValue: 'https://89-207-250-217.sslip.io')}/api/v1/generated-documents/$documentId/dispatches'));
      if (response.statusCode != 200) {
        throw const HttpException('Не удалось восстановить статус отправки');
      }
      final records = jsonDecode(response.body) as List;
      if (!mounted || documentId != WorkflowRuntime.generatedId) return;
      if (records.isNotEmpty && !hasLocalDraft) {
        final record = records.first as Map<String, dynamic>;
        restoring = true;
        updateState(() {
          selectedMethod = {
                'email': 'E-mail',
                'whatsapp': 'WhatsApp',
                'sms': 'SMS',
                'post': 'Почтовая отправка'
              }[record['method']] ??
              'WhatsApp';
          recipientController.text = record['contact'] as String;
          sent = record['status'] == 'manual_sent_unverified';
          status = sent
              ? 'Ручная отправка записана. Доставка не подтверждена.'
              : 'Черновик отправки восстановлен';
        });
        restoring = false;
        await persistDispatch();
      } else {
        updateState(() => status = records.isEmpty
            ? 'Записей отправки пока нет'
            : 'Предыдущая запись на сервере сохранена. Текущий черновик не отправлен.');
      }
    } catch (error) {
      updateState(() => status = '$error');
    } finally {
      restoring = false;
      updateState(() => busy = false);
    }
  }

  @override
  void dispose() {
    recipientController.dispose();
    super.dispose();
  }

  Future<void> recordAssistedSend() async {
    if (recipientController.text.trim().isEmpty) {
      updateState(() => status = 'Укажите контакт получателя');
      return;
    }
    final accepted = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
              title: const Text('Зафиксировать ручную отправку?'),
              content: const Text(
                  'Приложение не отправляет документ получателю и не подтверждает доставку.'),
              actions: [
                TextButton(
                    onPressed: () => Navigator.pop(context, false),
                    child: const Text('Отмена')),
                FilledButton(
                    onPressed: () => Navigator.pop(context, true),
                    child: const Text('Подтвердить'))
              ],
            ));
    if (accepted != true || !mounted) return;
    await saveDispatch(true);
  }

  Future<void> saveDispatch(bool manual) async {
    if (busy) return;
    if (WorkflowRuntime.generatedId.isEmpty) {
      updateState(() => status = 'Сначала сформируйте и сохраните проект');
      return;
    }
    updateState(() => busy = true);
    try {
      await HttpWorkflowApi().saveDraft(
          WorkflowRuntime.generatedId, WorkflowRuntime.generatedBody);
      final method = {
        'E-mail': 'email',
        'WhatsApp': 'whatsapp',
        'SMS': 'sms',
        'Почтовая отправка': 'post'
      }[selectedMethod];
      final response = await http.post(
          Uri.parse(
              '${const String.fromEnvironment('API_BASE_URL', defaultValue: 'https://89-207-250-217.sslip.io')}/api/v1/generated-documents/${WorkflowRuntime.generatedId}/dispatches'),
          headers: {'content-type': 'application/json'},
          body: jsonEncode({
            'method': method,
            'contact': recipientController.text,
            'status': manual ? 'manual_sent_unverified' : 'draft',
            'confirmed': manual
          }));
      final record = jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode != 201) {
        throw HttpException(
            '${record['message'] ?? 'Не удалось сохранить отправку'}');
      }
      sent = manual;
      hasLocalDraft = false;
      await persistDispatch();
      if (mounted) {
        updateState(() {
          sent = manual;
          status = manual
              ? 'Ручная отправка записана. Доставка не подтверждена.'
              : 'Черновик отправки сохранён на сервере';
        });
      }
    } catch (error) {
      if (mounted) updateState(() => status = '$error');
    } finally {
      updateState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const AizanHeader(compact: true),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Text(
              'Выберите способ отправки',
              style: Theme.of(context)
                  .textTheme
                  .headlineSmall
                  ?.copyWith(color: AppColors.goldDark),
            ),
            const SizedBox(height: 16),
            _ClaimProgressCard(
              progress: sent ? 1 : 0,
              subtitle: status,
            ),
            const SizedBox(height: 12),
            _ClaimStageRail(items: [
              (
                title: '1. Проект',
                done: WorkflowRuntime.generatedBody.isNotEmpty
              ),
              (title: '2. Канал', done: selectedMethod.isNotEmpty),
              (
                title: '3. Контакт',
                done: recipientController.text.trim().isNotEmpty
              ),
              (title: '4. Статус', done: sent),
            ]),
            const SizedBox(height: 12),
            _SendMethodGrid(
              selected: selectedMethod,
              onSelect: (value) {
                if (busy) return;
                updateState(() {
                  selectedMethod = value;
                  sent = false;
                  status = 'Канал выбран: $value. Укажите контакт получателя.';
                  hasLocalDraft = true;
                  persistDispatch();
                });
              },
            ),
            const SizedBox(height: 12),
            const _RecipientCard(),
            const SizedBox(height: 12),
            const _AttachmentCard(),
            const SizedBox(height: 12),
            TextField(
              enabled: !busy,
              controller: recipientController,
              onChanged: (_) => updateState(() {
                sent = false;
                status =
                    'Контакт введен. Можно зафиксировать assisted отправку.';
              }),
              decoration:
                  const InputDecoration(labelText: 'Контакт получателя'),
            ),
            const SizedBox(height: 12),
            const Card(
                child: Padding(
              padding: EdgeInsets.all(16),
              child: Text(
                  'Здравствуйте!\nНаправляю Вам претензию по делу. Прошу ознакомиться с документом во вложении.\nС уважением,\nAI Юрист'),
            )),
            const SizedBox(height: 12),
            const Card(
              child: ListTile(
                leading:
                    Icon(Icons.verified_user_outlined, color: AppColors.gold),
                title: Text(
                    'Доставка сообщения зависит от внешнего сервиса. Статус отправки фиксируется вручную после подключения сервиса.'),
              ),
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: busy ? null : recordAssistedSend,
              icon: const Icon(Icons.mark_email_read_outlined),
              label: Text(sent ? 'Ручной статус зафиксирован' : 'Отправить'),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: busy ? null : () => saveDispatch(false),
              icon: const Icon(Icons.description_outlined),
              label: const Text('Сохранить как черновик'),
            ),
            TextButton(
                onPressed: busy || WorkflowRuntime.generatedId.isEmpty
                    ? null
                    : restoreDispatch,
                child: const Text('Обновить статус')),
          ],
        ),
      ),
    );
  }
}

class _ClaimBuildHero extends StatelessWidget {
  const _ClaimBuildHero();

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Row(
          children: [
            const Icon(Icons.edit_document, color: AppColors.gold, size: 72),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Подготовка досудебной претензии',
                      style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 8),
                  const Text(
                      'AI юрист анализирует данные дела и формирует текст претензии по подтвержденным источникам РК.'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ClaimSteps extends StatelessWidget {
  const _ClaimSteps({
    required this.onGenerate,
    required this.generated,
    required this.hasRequiredFields,
  });

  final VoidCallback onGenerate;
  final bool generated;
  final bool hasRequiredFields;

  @override
  Widget build(BuildContext context) {
    final steps = [
      ('Дело создано в базе', MobileCaseRuntime.activeCaseId.isNotEmpty),
      ('Данные сторон заполнены', hasRequiredFields),
      (
        'Официальные нормы проверяются',
        MobileCaseRuntime.activeCaseId.isNotEmpty,
      ),
      ('Текст претензии сформирован', generated),
    ];
    return Card(
      child: Column(
        children: [
          for (final step in steps)
            ListTile(
              leading: Icon(
                step.$2
                    ? Icons.check_circle_outline
                    : Icons.radio_button_checked,
                color: AppColors.gold,
              ),
              title: Text(step.$1),
              onTap: step.$2 ? null : onGenerate,
            ),
        ],
      ),
    );
  }
}

class _ClaimBasisCard extends StatelessWidget {
  const _ClaimBasisCard();

  @override
  Widget build(BuildContext context) {
    return const Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Text(
            'Основания: подтвержденные нормы РК добавляются только после поиска в официальных источниках. Если источник не подтвержден, документ уходит на ручную проверку.'),
      ),
    );
  }
}

class _ClaimProgressCard extends StatelessWidget {
  const _ClaimProgressCard({required this.progress, required this.subtitle});

  final double progress;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Прогресс подготовки'),
                Text('${(progress * 100).round()}%'),
              ],
            ),
            const SizedBox(height: 10),
            LinearProgressIndicator(value: progress),
            const SizedBox(height: 8),
            Text(subtitle),
          ],
        ),
      ),
    );
  }
}

class _ClaimStageRail extends StatelessWidget {
  const _ClaimStageRail({required this.items});

  final List<({String title, bool done})> items;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 6,
      runSpacing: 6,
      children: [
        for (final item in items)
          Chip(
            avatar: Icon(
              item.done ? Icons.check_circle : Icons.circle_outlined,
              size: 16,
            ),
            label: Text(item.title),
            side: BorderSide(
              color: item.done ? AppColors.gold : Colors.white24,
            ),
          ),
      ],
    );
  }
}

class _ClaimAiChat extends StatelessWidget {
  const _ClaimAiChat({required this.status, required this.generated});

  final String status;
  final bool generated;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'AI подготовка претензии',
              style:
                  TextStyle(color: AppColors.gold, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Text(status),
            const SizedBox(height: 8),
            Text(
              generated
                  ? 'Следующий шаг: проверьте черновик и подтвердите отправку.'
                  : 'Следующий шаг: заполните реальные данные и создайте проект через API.',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
      ),
    );
  }
}

class _ClaimStatusChips extends StatelessWidget {
  const _ClaimStatusChips();

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: const [
        Chip(label: Text('Черновик')),
        Chip(label: Text('Требует проверки')),
        Chip(label: Text('Требует подтверждения')),
      ],
    );
  }
}

class _SendMethodGrid extends StatelessWidget {
  const _SendMethodGrid({required this.selected, required this.onSelect});

  final String selected;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) {
    final methods = [
      ('E-mail', Icons.mail_outline),
      ('WhatsApp', Icons.phone_in_talk_outlined),
      ('SMS', Icons.chat_bubble_outline),
      ('Почтовая отправка', Icons.local_post_office_outlined),
    ];
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 1.35,
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      children: [
        for (final method in methods)
          Card(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
              side: BorderSide(
                  color: selected == method.$1
                      ? AppColors.gold
                      : Colors.transparent),
            ),
            child: InkWell(
              onTap: () => onSelect(method.$1),
              borderRadius: BorderRadius.circular(20),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(method.$2, color: AppColors.gold),
                  const SizedBox(height: 8),
                  Text(method.$1, textAlign: TextAlign.center),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

class _RecipientCard extends StatelessWidget {
  const _RecipientCard();

  @override
  Widget build(BuildContext context) {
    return const Card(
      child: ListTile(
        leading: Icon(Icons.phone_in_talk_outlined, color: AppColors.gold),
        title: Text('Получатель'),
        subtitle: Text('Контакт вводится пользователем перед отправкой'),
      ),
    );
  }
}

class _AttachmentCard extends StatelessWidget {
  const _AttachmentCard();

  @override
  Widget build(BuildContext context) {
    return const Card(
      child: ListTile(
        leading: Icon(Icons.picture_as_pdf_outlined, color: AppColors.gold),
        title: Text('Претензия.pdf'),
        subtitle: Text('Формируется из API-проекта претензии'),
        trailing: Icon(Icons.download_outlined),
      ),
    );
  }
}
