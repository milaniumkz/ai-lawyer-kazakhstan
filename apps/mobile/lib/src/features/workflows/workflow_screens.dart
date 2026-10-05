import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;

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
    respondentController = TextEditingController();
    amountController = TextEditingController();
    reasonController = TextEditingController();
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
    if (claimantController.text.trim().isEmpty ||
        respondentController.text.trim().isEmpty ||
        amountController.text.trim().isEmpty ||
        reasonController.text.trim().isEmpty) {
      setState(
          () => status = 'Заполните заявителя, ответчика, сумму и основание');
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

  double progressValue() => workflowStages().where((step) => step.done).length / workflowStages().length;

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
                onChanged: (_) => setState(() {}),
                decoration: InputDecoration(labelText: 'Заявитель')),
            const SizedBox(height: 12),
            TextField(
                controller: respondentController,
                onChanged: (_) => setState(() {}),
                decoration: const InputDecoration(labelText: 'Ответчик')),
            const SizedBox(height: 12),
            TextField(
              controller: amountController,
              onChanged: (_) => setState(() {}),
              keyboardType: TextInputType.number,
              decoration:
                  const InputDecoration(labelText: 'Сумма требования, ₸'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: reasonController,
              onChanged: (_) => setState(() {}),
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
  late final TextEditingController bodyController;
  final bodyFocus = FocusNode();
  @override
  void initState() { super.initState(); bodyController = TextEditingController(text: WorkflowRuntime.generatedBody); }
  @override
  void dispose() { bodyController.dispose(); bodyFocus.dispose(); super.dispose(); }
  Future<void> exportPdf() async {
    try { await exportClaimPdf(bodyController.text); }
    catch (error) { if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Не удалось создать PDF: $error'))); }
  }
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: const AizanHeader(compact: true),
    body: Center(child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 480),
      child: ListView(padding: const EdgeInsets.all(20), children: [
        Text('Предпросмотр документа', textAlign: TextAlign.center, style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 16),
        const _ClaimStatusChips(),
        const SizedBox(height: 18),
        Card(color: const Color(0xFFF4EDDE), child: Padding(padding: const EdgeInsets.all(20), child: Column(children: [
          const Icon(Icons.balance_outlined, color: Color(0xFF9C6F21), size: 44),
          const SizedBox(height: 14),
          const Text('Досудебная претензия', style: TextStyle(fontFamily: 'AizanSerif', fontSize: 24, color: Color(0xFF3C2A0F))),
          TextField(controller: bodyController, focusNode: bodyFocus, minLines: 12, maxLines: null,
            style: const TextStyle(color: Color(0xFF332513), fontFamily: 'AizanSerif', height: 1.5),
            decoration: const InputDecoration(fillColor: Colors.transparent, hintText: 'Сначала сформируйте проект'),
            onChanged: (value) => setState(() { WorkflowRuntime.generatedBody = value; approved = false; })),
        ]))),
        const SizedBox(height: 14),
        Row(children: [Expanded(child: OutlinedButton.icon(onPressed: bodyFocus.requestFocus, icon: const Icon(Icons.edit_outlined), label: const Text('Редактировать'))),
          const SizedBox(width: 8), Expanded(child: OutlinedButton.icon(onPressed: bodyController.text.trim().isEmpty ? null : exportPdf, icon: const Icon(Icons.picture_as_pdf_outlined), label: const Text('Скачать PDF')))]),
        CheckboxListTile(value: approved, onChanged: (value) => setState(() => approved = value ?? false), title: const Text('Проверено пользователем')),
        AizanButton(label: 'Перейти к отправке', icon: Icons.send_outlined,
          onPressed: approved && bodyController.text.trim().isNotEmpty ? () => context.go('/workflow/pretrial-claim/send') : null),
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
  var selectedMethod = 'WhatsApp';
  var status = 'Выберите канал и укажите контакт получателя';
  late final TextEditingController recipientController;

  @override
  void initState() {
    super.initState();
    recipientController = TextEditingController();
  }

  @override
  void dispose() {
    recipientController.dispose();
    super.dispose();
  }

  Future<void> recordAssistedSend() async {
    if (recipientController.text.trim().isEmpty) {
      setState(() => status = 'Укажите контакт получателя');
      return;
    }
    final accepted = await showDialog<bool>(context: context, builder: (context) => AlertDialog(
      title: const Text('Зафиксировать ручную отправку?'),
      content: const Text('Приложение не отправляет документ получателю и не подтверждает доставку.'),
      actions: [TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Отмена')),
        FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Подтвердить'))],
    ));
    if (accepted != true || !mounted) return;
    setState(() {
      sent = true;
      status =
          'Ручной статус зафиксирован: $selectedMethod, ${recipientController.text.trim()}';
    });
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
              (title: '1. Проект', done: WorkflowRuntime.generatedBody.isNotEmpty),
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
              onSelect: (value) => setState(() {
                selectedMethod = value;
                sent = false;
                status = 'Канал выбран: $value. Укажите контакт получателя.';
              }),
            ),
            const SizedBox(height: 12),
            const _RecipientCard(),
            const SizedBox(height: 12),
            const _AttachmentCard(),
            const SizedBox(height: 12),
            TextField(
              controller: recipientController,
              onChanged: (_) => setState(() {
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
                    'Доставка сообщения зависит от внешнего сервиса. Статус отправки фиксируется вручную или через официальный adapter.'),
              ),
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: recordAssistedSend,
              icon: const Icon(Icons.mark_email_read_outlined),
              label: Text(sent ? 'Ручной статус зафиксирован' : 'Отправить'),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () => setState(() {
                sent = false;
                status = 'Черновик сохранен локально до внешней отправки';
              }),
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
