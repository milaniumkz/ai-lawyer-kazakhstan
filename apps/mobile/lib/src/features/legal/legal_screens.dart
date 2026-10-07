import '../../widgets/mounted_state.dart';
import '../../api/session_credentials.dart';
import '../cases/case_screens.dart';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import '../../api/session_http.dart' as http;

import '../../api/api_contract.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_bottom_nav.dart';

class LegalSourcesScreen extends StatefulWidget {
  const LegalSourcesScreen({super.key, this.legalApi});

  final LegalApiPort? legalApi;

  @override
  State<LegalSourcesScreen> createState() => _LegalSourcesScreenState();
}

class _LegalSourcesScreenState extends State<LegalSourcesScreen>
    with MountedState<LegalSourcesScreen> {
  late final LegalApiPort legalApi;
  late final TextEditingController queryController;
  var searched = false;
  var busy = false;
  var answer = 'Введите вопрос и нажмите найти норму.';
  LegalAnswerFragment? fragment;

  int progressValue() {
    if (busy) return 45;
    if (fragment != null) return answer.contains('Цитата проверена') ? 100 : 82;
    if (searched) return 64;
    return 18;
  }

  List<({String title, bool done})> ragStages() => [
        (title: '1. Вопрос', done: queryController.text.trim().isNotEmpty),
        (title: '2. Источники', done: searched),
        (title: '3. Проверка', done: fragment != null),
        (title: '4. Цитата', done: answer.contains('Цитата проверена')),
        (title: '5. Ответ', done: searched && !busy),
      ];

  String nextAiStep() {
    if (busy) return 'Ищу официальные источники РК и сверяю применимость.';
    if (!searched) {
      return 'Введите вопрос. Я отвечу только при наличии подтвержденного официального источника.';
    }
    if (fragment == null) {
      return 'Нет подтвержденной нормы. Нужна ручная проверка или уточнение вопроса.';
    }
    if (!answer.contains('Цитата проверена')) {
      return 'Источник найден. Проверьте цитату перед использованием в документе.';
    }
    return 'Цитата проверена. Ответ можно использовать как источник для проекта документа.';
  }

  @override
  void initState() {
    super.initState();
    legalApi = widget.legalApi ?? HttpLegalApi();
    queryController =
        TextEditingController(text: 'взыскание долга по расписке');
  }

  @override
  void dispose() {
    queryController.dispose();
    super.dispose();
  }

  Future<void> searchNorm() async {
    if (busy) return;
    updateState(() {
      busy = true;
      searched = true;
      answer = 'Идет поиск по официальным источникам РК...';
      fragment = null;
    });
    try {
      final result = await legalApi.answer(queryController.text.trim());
      updateState(() {
        answer = result.message;
        fragment = result.fragment;
      });
    } catch (error) {
      updateState(
          () => answer = 'Нет подтвержденной нормы. API ошибка: $error');
    } finally {
      if (mounted) updateState(() => busy = false);
    }
  }

  Future<void> validateCitation() async {
    if (fragment == null) {
      updateState(
          () => answer = 'Нет подтвержденной нормы для проверки цитаты.');
      return;
    }
    try {
      final message = await legalApi.validateCitation(fragment!);
      updateState(() => answer = message);
    } catch (error) {
      updateState(() => answer = 'Citation API ошибка: $error');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Нормы права')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Text(
              'AI поиск нормы',
              style: Theme.of(context)
                  .textTheme
                  .headlineMedium
                  ?.copyWith(color: AppColors.goldDark),
            ),
            const SizedBox(height: 16),
            _RagProgressCard(
              progress: progressValue(),
              subtitle: fragment == null
                  ? 'Официальные источники РК · проверка обязательна'
                  : 'Источник найден · ${fragment!.sourceUrl}',
            ),
            const SizedBox(height: 12),
            _RagStageRail(items: ragStages()),
            const SizedBox(height: 12),
            _RagChatCard(
              question: queryController.text.trim(),
              step: nextAiStep(),
              answer: answer,
              hasSource: fragment != null,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: queryController,
              onSubmitted: (_) => searchNorm(),
              decoration: InputDecoration(
                labelText: 'Поиск нормы права',
                prefixIcon: Icon(Icons.search_outlined),
                suffixIcon: IconButton(
                  tooltip: 'Найти норму',
                  onPressed: busy ? null : searchNorm,
                  icon: const Icon(Icons.search),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final query in const [
                  'взыскание алиментов',
                  'алименты на ребенка',
                  'размер алиментов',
                  'индексация алиментов'
                ])
                  ActionChip(
                    label: Text(query),
                    onPressed: () => queryController.text = query,
                  ),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              children: const [
                ChoiceChip(label: Text('Кодексы'), selected: true),
                ChoiceChip(label: Text('Законы'), selected: false),
                ChoiceChip(label: Text('Судебная практика'), selected: false),
              ],
            ),
            const SizedBox(height: 16),
            Text(answer),
            const SizedBox(height: 12),
            if (searched) ...[
              Card(
                child: ListTile(
                  leading: const Icon(Icons.verified_outlined,
                      color: AppColors.gold),
                  title: Text(fragment == null
                      ? 'Нет подтвержденной нормы'
                      : 'Норма найдена'),
                  subtitle: Text(fragment == null
                      ? 'Будет нужна ручная проверка.'
                      : 'Источник: ${fragment!.sourceUrl}'),
                ),
              ),
              const SizedBox(height: 12),
            ],
            const _SafeRefusalCard(),
            const SizedBox(height: 12),
            _CitationCard(onTap: validateCitation),
          ],
        ),
      ),
    );
  }
}

class DeadlinesScreen extends StatefulWidget {
  const DeadlinesScreen({super.key});

  @override
  State<DeadlinesScreen> createState() => _DeadlinesScreenState();
}

class _DeadlinesScreenState extends State<DeadlinesScreen>
    with MountedState<DeadlinesScreen> {
  final titleController = TextEditingController();
  DateTime? date;
  List<Map<String, dynamic>> tasks = [];
  var busy = false;
  var filter = 'Все';
  var status = 'Добавьте задачу и подтвердите дату самостоятельно';
  @override
  void initState() {
    super.initState();
    if (SessionCredentials.token.isNotEmpty) loadTasks();
  }

  @override
  void dispose() {
    titleController.dispose();
    super.dispose();
  }

  Future<void> loadTasks() async {
    if (busy) return;
    updateState(() => busy = true);
    try {
      final response = await http.get(Uri.parse(
          '${const String.fromEnvironment('API_BASE_URL', defaultValue: 'https://89-207-250-217.sslip.io')}/api/v1/tasks'));
      if (response.statusCode != 200) {
        throw const HttpException('Не удалось загрузить задачи');
      }
      final list =
          (jsonDecode(response.body) as List).cast<Map<String, dynamic>>();
      if (mounted) updateState(() => tasks = list);
    } catch (error) {
      if (mounted) updateState(() => status = '$error');
    } finally {
      if (mounted) updateState(() => busy = false);
    }
  }

  Future<void> addTask() async {
    if (date == null || titleController.text.trim().isEmpty || busy) return;
    try {
      final response = await http.post(
          Uri.parse(
              '${const String.fromEnvironment('API_BASE_URL', defaultValue: 'https://89-207-250-217.sslip.io')}/api/v1/tasks'),
          headers: {'content-type': 'application/json'},
          body: jsonEncode({
            'title': titleController.text.trim(),
            'dueDate': date!.toIso8601String().substring(0, 10),
            if (MobileCaseRuntime.activeCaseId.isNotEmpty)
              'caseId': MobileCaseRuntime.activeCaseId
          }));
      if (response.statusCode != 201) {
        throw const HttpException('Не удалось сохранить задачу');
      }
      titleController.clear();
      await loadTasks();
      if (mounted) updateState(() => status = 'Задача сохранена на сервере');
    } catch (error) {
      if (mounted) updateState(() => status = '$error');
    }
  }

  Future<void> deleteTask(Map<String, dynamic> task) async {
    final accepted = await showDialog<bool>(
        context: context,
        builder: (context) =>
            AlertDialog(title: const Text('Удалить задачу?'), actions: [
              TextButton(
                  onPressed: () => Navigator.pop(context, false),
                  child: const Text('Отмена')),
              TextButton(
                  onPressed: () => Navigator.pop(context, true),
                  child: const Text('Удалить'))
            ]));
    if (accepted != true || !mounted) return;
    try {
      final response = await http.delete(Uri.parse(
          '${const String.fromEnvironment('API_BASE_URL', defaultValue: 'https://89-207-250-217.sslip.io')}/api/v1/tasks/${task['id']}'));
      if (response.statusCode != 200) {
        throw const HttpException('Не удалось удалить задачу');
      }
      await loadTasks();
    } catch (error) {
      updateState(() => status = '$error');
    }
  }

  Future<void> updateTask(Map<String, dynamic> task) async {
    try {
      final response = await http.patch(
          Uri.parse(
              '${const String.fromEnvironment('API_BASE_URL', defaultValue: 'https://89-207-250-217.sslip.io')}/api/v1/tasks/${task['id']}'),
          headers: {'content-type': 'application/json'},
          body: jsonEncode({
            'status': task['status'] == 'completed' ? 'pending' : 'completed'
          }));
      if (response.statusCode != 200) {
        throw const HttpException('Не удалось сохранить статус');
      }
      await loadTasks();
    } catch (error) {
      if (mounted) updateState(() => status = '$error');
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
      appBar: AppBar(title: const Text('Сроки')),
      bottomNavigationBar: const AppBottomNav(selectedIndex: 3),
      body: SafeArea(
          child: ListView(padding: const EdgeInsets.all(24), children: [
        Text('Календарь и сроки',
            style: Theme.of(context)
                .textTheme
                .headlineMedium
                ?.copyWith(color: AppColors.goldDark)),
        const SizedBox(height: 16),
        const _EmptyDeadlinesCalendar(),
        const SizedBox(height: 16),
        TextField(
            controller: titleController,
            maxLength: 200,
            decoration: const InputDecoration(labelText: 'Название задачи'),
            onChanged: (_) => updateState(() {})),
        OutlinedButton.icon(
            onPressed: () async {
              final picked = await showDatePicker(
                  context: context,
                  initialDate: date ?? DateTime.now(),
                  firstDate: DateTime(2000),
                  lastDate: DateTime(2100));
              if (picked != null && mounted) updateState(() => date = picked);
            },
            icon: const Icon(Icons.calendar_today),
            label: Text(date == null
                ? 'Выбрать дату'
                : date!.toIso8601String().substring(0, 10))),
        FilledButton(
            onPressed:
                busy || date == null || titleController.text.trim().isEmpty
                    ? null
                    : addTask,
            child: const Text('Добавить задачу')),
        TextButton(
            onPressed: busy ? null : loadTasks, child: const Text('Обновить')),
        Text(status),
        const Text(
            'Юридические сроки требуют проверки. Даты задач задаются вами.'),
        Wrap(spacing: 8, children: [
          for (final value in ['Все', 'Активные', 'Выполненные'])
            ChoiceChip(
                selected: filter == value,
                label: Text(value),
                onSelected: (_) => updateState(() => filter = value))
        ]),
        if (busy) const LinearProgressIndicator(),
        if (tasks.isEmpty)
          const _DeadlineCard(
              'Нет рассчитанных сроков',
              'После выбора дела',
              'Добавьте задачу с подтверждённой датой',
              Icons.event_busy_outlined),
        for (final task in tasks.where((task) =>
            filter == 'Все' ||
            (filter == 'Выполненные') == (task['status'] == 'completed')))
          Card(
              child: CheckboxListTile(
                  value: task['status'] == 'completed',
                  title: Text(task['title'] as String),
                  subtitle: Text(task['dueDate'] as String),
                  secondary: IconButton(
                      tooltip: 'Удалить задачу',
                      onPressed: busy ? null : () => deleteTask(task),
                      icon: const Icon(Icons.delete_outline)),
                  onChanged: busy ? null : (_) => updateTask(task))),
      ])));
}

class _DeadlineCard extends StatelessWidget {
  const _DeadlineCard(this.title, this.date, this.status, this.icon);

  final String title;
  final String date;
  final String status;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: Icon(icon, color: AppColors.gold),
        title: Text(title),
        subtitle: Text(status),
        trailing: Text(date),
        onTap: () => ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('$title: $date')),
        ),
      ),
    );
  }
}

class _EmptyDeadlinesCalendar extends StatelessWidget {
  const _EmptyDeadlinesCalendar();

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(Icons.calendar_month_outlined, color: AppColors.gold),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Календарь пуст',
                      style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 6),
                  const Text(
                    'Создайте или откройте дело, укажите подтвержденные даты, затем AI рассчитает процессуальные сроки.',
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

class _SafeRefusalCard extends StatelessWidget {
  const _SafeRefusalCard();

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            const Icon(Icons.gpp_maybe_outlined, color: AppColors.gold),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Если официальное подтверждение не найдено, ответ уходит в уточнение или экспертную проверку.',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RagProgressCard extends StatelessWidget {
  const _RagProgressCard({required this.progress, required this.subtitle});

  final int progress;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: const BorderSide(color: AppColors.gold),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                    child: Text(
                        'RAG · этап ${(progress / 20).ceil().clamp(1, 5)} из 5')),
                Text('$progress%',
                    style: Theme.of(context)
                        .textTheme
                        .titleLarge
                        ?.copyWith(color: AppColors.goldDark)),
              ],
            ),
            const SizedBox(height: 8),
            LinearProgressIndicator(value: progress / 100),
            const SizedBox(height: 8),
            Text(subtitle),
          ],
        ),
      ),
    );
  }
}

class _RagStageRail extends StatelessWidget {
  const _RagStageRail({required this.items});

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
            side:
                BorderSide(color: item.done ? AppColors.gold : Colors.white24),
          ),
      ],
    );
  }
}

class _RagChatCard extends StatelessWidget {
  const _RagChatCard({
    required this.question,
    required this.step,
    required this.answer,
    required this.hasSource,
  });

  final String question;
  final String step;
  final String answer;
  final bool hasSource;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _RagBubble(
          title: 'Вы',
          text: question.isEmpty ? 'Вопрос еще не введен.' : question,
          user: true,
        ),
        _RagBubble(
          title: 'AI Юрист',
          text: step,
          footer: hasSource
              ? 'Источник подтвержден'
              : 'Нет подтвержденной нормы без источника',
        ),
        if (answer.isNotEmpty)
          _RagBubble(
            title: hasSource ? 'Ответ с источником' : 'Guardrail',
            text: answer,
          ),
      ],
    );
  }
}

class _RagBubble extends StatelessWidget {
  const _RagBubble({
    required this.title,
    required this.text,
    this.footer,
    this.user = false,
  });

  final String title;
  final String text;
  final String? footer;
  final bool user;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: user ? Alignment.centerRight : Alignment.centerLeft,
      child: Card(
        color: user ? AppColors.gold.withValues(alpha: 0.12) : null,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title,
                  style: const TextStyle(
                      color: AppColors.gold, fontWeight: FontWeight.w700)),
              const SizedBox(height: 6),
              Text(text),
              if (footer != null) ...[
                const SizedBox(height: 6),
                Text(footer!, style: Theme.of(context).textTheme.bodySmall),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _CitationCard extends StatelessWidget {
  const _CitationCard({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: const Icon(Icons.verified_outlined, color: AppColors.gold),
        title: const Text('Citation Validator'),
        subtitle: const Text(
            'Проверяет акт, статью, статус, дату применимости, источник и совпадение цитаты.'),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}

class LegalAnswerResult {
  const LegalAnswerResult({required this.message, this.fragment});

  final String message;
  final LegalAnswerFragment? fragment;
}

class LegalAnswerFragment {
  const LegalAnswerFragment({
    required this.id,
    required this.sourceUrl,
    required this.text,
    this.officialId,
    this.article,
  });

  final String id;
  final String sourceUrl;
  final String text;
  final String? officialId;
  final String? article;
}

abstract class LegalApiPort {
  Future<LegalAnswerResult> answer(String query);
  Future<String> validateCitation(LegalAnswerFragment fragment);
}

class HttpLegalApi implements LegalApiPort {
  HttpLegalApi({
    this.baseUrl = const String.fromEnvironment(
      'API_BASE_URL',
      defaultValue: 'https://89-207-250-217.sslip.io',
    ),
  });

  final String baseUrl;

  @override
  Future<LegalAnswerResult> answer(String query) async {
    final body = await _postJson(ApiContract.ragAnswer, {'query': query});
    final fragment = body['fragment'] as Map<String, dynamic>?;
    return LegalAnswerResult(
      message: body['message'] as String? ?? 'Нет подтвержденной нормы',
      fragment: fragment == null
          ? null
          : LegalAnswerFragment(
              id: fragment['id'] as String? ?? '',
              sourceUrl: fragment['sourceUrl'] as String? ?? '',
              text: fragment['text'] as String? ?? '',
              officialId: fragment['officialId'] as String?,
              article: fragment['article'] as String?,
            ),
    );
  }

  @override
  Future<String> validateCitation(LegalAnswerFragment fragment) async {
    final body = await _postJson(ApiContract.citationsValidate, {
      if (fragment.id.isNotEmpty) 'fragmentId': fragment.id,
      if (fragment.officialId != null) 'officialId': fragment.officialId,
      if (fragment.article != null) 'article': fragment.article,
      'quotedText': fragment.text,
    });
    return body['message'] as String? ?? 'Цитата проверена';
  }

  Future<Map<String, dynamic>> _postJson(
      String path, Map<String, dynamic> payload) async {
    final response = await http.post(
      Uri.parse('$baseUrl${ApiContract.basePath}$path'),
      headers: const {
        'content-type': 'application/json',
        'x-correlation-id': 'mobile-legal',
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
