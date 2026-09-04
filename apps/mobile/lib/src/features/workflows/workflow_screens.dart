import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;

import '../../api/api_contract.dart';
import '../cases/case_screens.dart';
import '../auth/auth_screens.dart';
import '../../theme/app_theme.dart';

class PretrialClaimScreen extends StatefulWidget {
  const PretrialClaimScreen({super.key, this.workflowApi});

  final WorkflowApiPort? workflowApi;

  @override
  State<PretrialClaimScreen> createState() => _PretrialClaimScreenState();
}

class _PretrialClaimScreenState extends State<PretrialClaimScreen> {
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
    respondentController = TextEditingController(text: 'Ответчик');
    amountController = TextEditingController(text: '1250000');
    reasonController =
        TextEditingController(text: 'Задолженность по договору займа');
  }

  @override
  void dispose() {
    claimantController.dispose();
    respondentController.dispose();
    amountController.dispose();
    reasonController.dispose();
    super.dispose();
  }

  Future<void> generateDraft() async {
    if (busy) return;
    if (MobileCaseRuntime.activeCaseId.isEmpty) {
      setState(() => status = 'Сначала создайте дело');
      return;
    }
    setState(() {
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
      WorkflowRuntime.generatedBody = draft.body;
      setState(() {
        generated = true;
        status = 'Проект сформирован: ${draft.id.substring(0, 8)}';
      });
      if (mounted) context.go('/workflow/pretrial-claim/draft');
    } catch (error) {
      setState(() => status = 'Генерация API ошибка: $error');
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

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
            TextField(
                controller: claimantController,
                decoration: InputDecoration(labelText: 'Заявитель')),
            const SizedBox(height: 12),
            TextField(
                controller: respondentController,
                decoration: const InputDecoration(labelText: 'Ответчик')),
            const SizedBox(height: 12),
            TextField(
              controller: amountController,
              keyboardType: TextInputType.number,
              decoration:
                  const InputDecoration(labelText: 'Сумма требования, ₸'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: reasonController,
              minLines: 3,
              maxLines: 5,
              decoration:
                  const InputDecoration(labelText: 'Основание требования'),
            ),
            const SizedBox(height: 16),
            Text(status),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: busy ? null : generateDraft,
              icon: const Icon(Icons.article_outlined),
              label: Text(busy
                  ? 'Формирую'
                  : generated
                      ? 'Проект сформирован'
                      : 'Сформировать проект'),
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
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Text(
                  WorkflowRuntime.generatedBody.isEmpty
                      ? 'Прошу погасить задолженность по договору займа. Перед отправкой документ требует проверки юристом.'
                      : WorkflowRuntime.generatedBody,
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
    final firstTemplate = templateList.isEmpty
        ? null
        : templateList.first as Map<String, dynamic>;
    final templateId =
        firstTemplate?['id'] as String? ?? 'tpl-pretrial-claim-ru-v1';
    final response = await http.post(
      Uri.parse(
          '$baseUrl${ApiContract.basePath}${ApiContract.documentsGenerate}'),
      headers: {
        'content-type': 'application/json',
        'x-correlation-id': 'mobile-workflow',
        'x-user-id': AuthRuntime.userId,
      },
      body: jsonEncode({
        'templateId': templateId,
        'caseId': caseId,
        'fields': {
          'claimantName': claimantName,
          'respondentName': respondentName,
          'claimAmount': claimAmount,
          'claimReason': claimReason,
          'deadlineDate': '14 сентября 2026',
        },
        'confirmedCitationIds': <String>[],
      }),
    );
    final body = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw HttpException(
          '${body['message'] ?? body['error'] ?? 'generate failed'}');
    }
    return GeneratedClaimDraft(
      id: body['id'] as String,
      body: body['body'] as String,
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
