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
              'Формирование претензии',
              style: Theme.of(context)
                  .textTheme
                  .headlineMedium
                  ?.copyWith(color: AppColors.goldDark),
            ),
            const SizedBox(height: 16),
            const _ClaimBuildHero(),
            const SizedBox(height: 12),
            _ClaimSteps(onGenerate: generateDraft),
            const SizedBox(height: 12),
            const _ClaimBasisCard(),
            const SizedBox(height: 12),
            _ClaimProgressCard(progress: generated ? 1 : 0.74),
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
            const _ClaimStatusChips(),
            const SizedBox(height: 16),
            Card(
              color: const Color(0xFFFBF7EF),
              child: Padding(
                padding: const EdgeInsets.all(22),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Center(
                      child: Icon(Icons.balance_outlined,
                          color: Color(0xFFAD7B25), size: 46),
                    ),
                    const SizedBox(height: 12),
                    Center(
                      child: Text(
                        'Досудебная претензия',
                        style: Theme.of(context)
                            .textTheme
                            .headlineMedium
                            ?.copyWith(color: const Color(0xFF101827)),
                      ),
                    ),
                    const SizedBox(height: 20),
                    _PaperSection(
                        title: 'От кого',
                        body:
                            '${AuthRuntime.displayName.isEmpty ? 'Заявитель' : AuthRuntime.displayName}\nКонтактные данные из профиля'),
                    const _PaperSection(
                        title: 'Кому',
                        body: 'Ответчик\nРеквизиты уточняются пользователем'),
                    _PaperSection(
                      title: 'Суть требования',
                      body: WorkflowRuntime.generatedBody.isEmpty
                          ? 'Прошу урегулировать спор в досудебном порядке. Перед отправкой документ требует проверки пользователя.'
                          : WorkflowRuntime.generatedBody,
                    ),
                    const _PaperSection(
                      title: 'Норма права',
                      body:
                          'Нет подтвержденной нормы. Требуется ручная проверка официального источника РК.',
                    ),
                  ],
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
            Text(
              'Выберите способ отправки',
              style: Theme.of(context)
                  .textTheme
                  .headlineSmall
                  ?.copyWith(color: AppColors.goldDark),
            ),
            const SizedBox(height: 16),
            const _SendMethodGrid(),
            const SizedBox(height: 12),
            const _RecipientCard(),
            const SizedBox(height: 12),
            const _AttachmentCard(),
            const SizedBox(height: 12),
            const TextField(
              decoration: InputDecoration(labelText: 'Контакт получателя'),
              controller: null,
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
                    'Доставка сообщения зависит от внешнего сервиса. Статус отправки фиксируется вручную или через официальный adapter.'),
              ),
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: () => setState(() => sent = true),
              icon: const Icon(Icons.mark_email_read_outlined),
              label: Text(sent ? 'Отправка зафиксирована' : 'Отправить'),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () => setState(() => sent = false),
              icon: const Icon(Icons.description_outlined),
              label: const Text('Сохранить как черновик'),
            ),
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
  const _ClaimSteps({required this.onGenerate});

  final VoidCallback onGenerate;

  @override
  Widget build(BuildContext context) {
    final steps = [
      ('Категория спора определена', true),
      ('Нормы права подобраны', true),
      ('Недостающие документы проверены', true),
      ('Текст претензии формируется', false),
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
  const _ClaimProgressCard({required this.progress});

  final double progress;

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
        Chip(label: Text('Проверено AI')),
        Chip(label: Text('Требует подтверждения')),
      ],
    );
  }
}

class _PaperSection extends StatelessWidget {
  const _PaperSection({required this.title, required this.body});

  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.only(top: 14, bottom: 14),
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: Color(0x33AD7B25))),
      ),
      child: Text('$title\n$body',
          style: const TextStyle(color: Color(0xFF101827), height: 1.45)),
    );
  }
}

class _SendMethodGrid extends StatelessWidget {
  const _SendMethodGrid();

  @override
  Widget build(BuildContext context) {
    final methods = [
      ('E-mail', Icons.mail_outline, false),
      ('WhatsApp', Icons.phone_in_talk_outlined, true),
      ('SMS', Icons.chat_bubble_outline, false),
      ('Почтовая отправка', Icons.local_post_office_outlined, false),
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
                  color: method.$3 ? AppColors.gold : Colors.transparent),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(method.$2, color: AppColors.gold),
                const SizedBox(height: 8),
                Text(method.$1, textAlign: TextAlign.center),
              ],
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
        subtitle: Text('Иванов Иван Иванович\n+7 905 123-45-67'),
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
        subtitle: Text('245 КБ'),
        trailing: Icon(Icons.download_outlined),
      ),
    );
  }
}
