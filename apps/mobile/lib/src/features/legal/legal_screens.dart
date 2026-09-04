import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import '../../api/api_contract.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_bottom_nav.dart';

class LegalSourcesScreen extends StatefulWidget {
  const LegalSourcesScreen({super.key, this.legalApi});

  final LegalApiPort? legalApi;

  @override
  State<LegalSourcesScreen> createState() => _LegalSourcesScreenState();
}

class _LegalSourcesScreenState extends State<LegalSourcesScreen> {
  late final LegalApiPort legalApi;
  late final TextEditingController queryController;
  var searched = false;
  var busy = false;
  var answer = 'Введите вопрос и нажмите найти норму.';
  LegalAnswerFragment? fragment;

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
    setState(() {
      busy = true;
      searched = true;
      answer = 'Идет поиск по официальным источникам РК...';
      fragment = null;
    });
    try {
      final result = await legalApi.answer(queryController.text.trim());
      setState(() {
        answer = result.message;
        fragment = result.fragment;
      });
    } catch (error) {
      setState(() => answer = 'Нет подтвержденной нормы. API ошибка: $error');
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> validateCitation() async {
    if (fragment == null) {
      setState(() => answer = 'Нет подтвержденной нормы для проверки цитаты.');
      return;
    }
    try {
      final message = await legalApi.validateCitation(fragment!);
      setState(() => answer = message);
    } catch (error) {
      setState(() => answer = 'Citation API ошибка: $error');
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
              'Официальные источники РК',
              style: Theme.of(context)
                  .textTheme
                  .headlineMedium
                  ?.copyWith(color: AppColors.goldDark),
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

class _DeadlinesScreenState extends State<DeadlinesScreen> {
  var reminderEnabled = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Сроки')),
      bottomNavigationBar: const AppBottomNav(selectedIndex: 3),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Text(
              'Календарь и сроки',
              style: Theme.of(context)
                  .textTheme
                  .headlineMedium
                  ?.copyWith(color: AppColors.goldDark),
            ),
            const SizedBox(height: 16),
            SwitchListTile(
              value: reminderEnabled,
              onChanged: (value) => setState(() => reminderEnabled = value),
              title: const Text('Напоминания'),
              subtitle: Text(reminderEnabled ? 'Включены' : 'Выключены'),
            ),
            const _DeadlineCard('Претензия', '18 апр 2024', 'Ожидает'),
            const _DeadlineCard('Подача в суд', '22 мая 2024', '12 дней'),
            const _DeadlineCard(
                'Судебное заседание', '05 июн 2024', 'Запланировано'),
          ],
        ),
      ),
    );
  }
}

class _DeadlineCard extends StatelessWidget {
  const _DeadlineCard(this.title, this.date, this.status);

  final String title;
  final String date;
  final String status;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading:
            const Icon(Icons.event_available_outlined, color: AppColors.gold),
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
