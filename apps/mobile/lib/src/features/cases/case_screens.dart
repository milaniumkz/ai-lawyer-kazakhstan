import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;
import 'package:record/record.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;

import '../../api/api_contract.dart';
import '../auth/auth_screens.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_bottom_nav.dart';

class CasesListScreen extends StatefulWidget {
  const CasesListScreen({super.key, this.caseApi});

  final CaseApiPort? caseApi;

  @override
  State<CasesListScreen> createState() => _CasesListScreenState();
}

class _CasesListScreenState extends State<CasesListScreen> {
  late final CaseApiPort caseApi;
  var selectedFilter = 'Все';
  var status = 'Локальные последние дела';
  var cases = caseItems;
  final filters = const ['Все', 'В работе', 'Суд', 'Претензии'];

  @override
  void initState() {
    super.initState();
    caseApi = widget.caseApi ?? HttpCaseApi();
    if (AuthRuntime.userId.isNotEmpty) {
      refreshCases();
    }
  }

  Future<void> refreshCases() async {
    if (AuthRuntime.userId.isEmpty) {
      setState(() => status = 'Войдите, чтобы загрузить дела из API');
      return;
    }
    setState(() => status = 'Загружаю дела из API...');
    try {
      final remote = await caseApi.listCases(AuthRuntime.userId);
      setState(() {
        cases = remote.isEmpty ? caseItems : remote;
        status = 'Дела загружены из API: ${remote.length}';
      });
    } catch (error) {
      setState(() => status = 'Cases API ошибка: $error');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Мои дела'),
        actions: [
          IconButton(
            tooltip: 'Поиск дела',
            onPressed: () => showSearch(
              context: context,
              delegate: _CaseSearchDelegate(),
            ),
            icon: const Icon(Icons.search),
          ),
          IconButton(
            tooltip: 'Обновить из API',
            onPressed: refreshCases,
            icon: const Icon(Icons.sync_outlined),
          ),
        ],
      ),
      bottomNavigationBar: const AppBottomNav(selectedIndex: 1),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final filter in filters)
                  ChoiceChip(
                    label: Text(filter),
                    selected: selectedFilter == filter,
                    onSelected: (_) => setState(() => selectedFilter = filter),
                  ),
              ],
            ),
            Text(status),
            const SizedBox(height: 12),
            const SizedBox(height: 18),
            for (final item in cases)
              _CaseListTile(
                item: item,
                onTap: () => context.go('/case/details'),
              ),
          ],
        ),
      ),
    );
  }
}

class CaseDetailsScreen extends StatelessWidget {
  const CaseDetailsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Карточка дела'),
        actions: [
          IconButton(
            tooltip: 'Поделиться',
            onPressed: () =>
                _showAction(context, 'Ссылка на дело подготовлена'),
            icon: const Icon(Icons.ios_share_outlined),
          ),
          PopupMenuButton<String>(
            onSelected: (value) => _showAction(context, value),
            itemBuilder: (context) => const [
              PopupMenuItem(value: 'Статус обновлен', child: Text('Обновить')),
              PopupMenuItem(
                  value: 'Дело отмечено важным', child: Text('Важное')),
            ],
          ),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Row(
              children: [
                const CircleAvatar(
                  radius: 44,
                  child: Icon(Icons.balance_outlined, size: 42),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Взыскание долга',
                          style: Theme.of(context).textTheme.headlineMedium),
                      const SizedBox(height: 4),
                      const Text('Дело №2024-0015 · Гражданское право'),
                      const Text('● В работе'),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
            const _CaseMetrics(),
            const SizedBox(height: 18),
            Text('Прогресс дела',
                style: Theme.of(context)
                    .textTheme
                    .titleLarge
                    ?.copyWith(color: AppColors.goldDark)),
            const SizedBox(height: 12),
            const _ProgressStrip(),
            const SizedBox(height: 12),
            const _DetailsGrid(),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: () => context.go('/case/chat'),
              icon: const Icon(Icons.auto_awesome_outlined),
              label: const Text('Продолжить работу'),
            ),
            const SizedBox(height: 10),
            OutlinedButton.icon(
              onPressed: () => context.go('/documents'),
              icon: const Icon(Icons.folder_outlined),
              label: const Text('Открыть документы'),
            ),
          ],
        ),
      ),
    );
  }
}

class NewCaseScreen extends StatefulWidget {
  const NewCaseScreen(
      {super.key,
      this.recorder,
      this.speechRecognizer,
      this.voiceApi,
      this.caseApi});

  final VoiceRecorderPort? recorder;
  final SpeechRecognizerPort? speechRecognizer;
  final VoiceTranscriptPort? voiceApi;
  final CaseApiPort? caseApi;

  @override
  State<NewCaseScreen> createState() => _NewCaseScreenState();
}

class _CaseSearchDelegate extends SearchDelegate<String> {
  @override
  List<Widget>? buildActions(BuildContext context) => [
        IconButton(
          tooltip: 'Очистить',
          onPressed: () => query = '',
          icon: const Icon(Icons.close),
        ),
      ];

  @override
  Widget? buildLeading(BuildContext context) => IconButton(
        tooltip: 'Назад',
        onPressed: () => close(context, ''),
        icon: const Icon(Icons.arrow_back),
      );

  @override
  Widget buildResults(BuildContext context) => buildSuggestions(context);

  @override
  Widget buildSuggestions(BuildContext context) {
    final items = caseItems
        .where((item) => item.title.toLowerCase().contains(query.toLowerCase()))
        .toList();
    return ListView(
      children: [
        for (final item in items)
          ListTile(
            title: Text(item.title),
            subtitle: Text(item.subtitle),
            onTap: () => close(context, item.title),
          ),
      ],
    );
  }
}

class _CaseListTile extends StatelessWidget {
  const _CaseListTile({required this.item, required this.onTap});

  final CaseListItem item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        onTap: onTap,
        leading: CircleAvatar(child: Icon(item.icon)),
        title: Text(item.title),
        subtitle: Text('${item.subtitle}\n${item.status}'),
        trailing: const Icon(Icons.chevron_right),
        isThreeLine: true,
      ),
    );
  }
}

class _CaseMetrics extends StatelessWidget {
  const _CaseMetrics();

  @override
  Widget build(BuildContext context) {
    const metrics = [
      (Icons.menu_book_outlined, 'Категория', 'Гражданское право'),
      (Icons.gavel_outlined, 'Стадия', 'Досудебная подготовка'),
      (Icons.account_balance_outlined, 'Маршрут', 'Арбитражный суд'),
      (Icons.calendar_month_outlined, 'Срок', '15 мая 2024'),
      (Icons.donut_large_outlined, 'Готовность', '65%'),
    ];
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final metric in metrics)
          SizedBox(
            width: 148,
            height: 156,
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(metric.$1, color: AppColors.gold),
                    const SizedBox(height: 8),
                    Text(
                      metric.$2,
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      metric.$3,
                      textAlign: TextAlign.center,
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _DetailsGrid extends StatelessWidget {
  const _DetailsGrid();

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: const [
        _InfoCard(
            title: 'Участники дела',
            body: 'Истец: ООО «Альфа»\nОтветчик: ООО «Бета»'),
        _InfoCard(
            title: 'Сумма и требования',
            body: 'Основной долг 1 250 000 ₸\nИтого 1 375 000 ₸'),
        _InfoCard(title: 'Документы', body: 'Всего: 12\nТребуют внимания: 2'),
        _InfoCard(
            title: 'Ключевые даты',
            body: 'Претензия: 18 апр 2024\nПодача в суд: 22 мая 2024'),
      ],
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({required this.title, required this.body});

  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 320,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title,
                  style: Theme.of(context)
                      .textTheme
                      .titleMedium
                      ?.copyWith(color: AppColors.goldDark)),
              const SizedBox(height: 8),
              Text(body),
            ],
          ),
        ),
      ),
    );
  }
}

void _showAction(BuildContext context, String message) {
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
}

class CaseListItem {
  const CaseListItem(this.title, this.subtitle, this.status, this.icon,
      [this.id = '']);

  final String title;
  final String subtitle;
  final String status;
  final IconData icon;
  final String id;
}

const caseItems = [
  CaseListItem('Взыскание долга', 'Гражданское право · Дело №2024-0015',
      '● В работе', Icons.balance_outlined),
  CaseListItem('Алименты', 'Семейное право · Дело №2024-0012',
      '● Ожидает документов', Icons.family_restroom_outlined),
  CaseListItem('Претензия к подрядчику', 'Договорное право · Дело №2024-0008',
      '● Отправлено', Icons.description_outlined),
  CaseListItem('Раздел имущества', 'Семейное право · Дело №2024-0003',
      '● Срок близко', Icons.account_balance_outlined),
  CaseListItem('Защита прав потребителя', 'Защита прав · Дело №2024-0001',
      '● В работе', Icons.verified_user_outlined),
];

class _NewCaseScreenState extends State<NewCaseScreen> {
  late final TextEditingController transcriptController;
  late final VoiceRecorderPort voiceRecorder;
  late final SpeechRecognizerPort speechRecognizer;
  late final VoiceTranscriptPort voiceApi;
  late final CaseApiPort caseApi;
  var isRecording = false;
  var isBusy = false;
  String? recordedPath;
  String? transcriptJobId;
  var speechStatus = 'Распознавание не запущено';
  var recognizedSpeech = '';
  var transcript = '';

  @override
  void initState() {
    super.initState();
    voiceRecorder = widget.recorder ?? RecordVoiceRecorder();
    speechRecognizer = widget.speechRecognizer ?? DeviceSpeechRecognizer();
    voiceApi = widget.voiceApi ?? HttpVoiceTranscriptApi();
    caseApi = widget.caseApi ?? HttpCaseApi();
    transcriptController = TextEditingController(text: transcript);
  }

  @override
  void dispose() {
    transcriptController.dispose();
    voiceRecorder.dispose();
    speechRecognizer.dispose();
    super.dispose();
  }

  Future<void> submitCase() async {
    if (isBusy) return;
    setState(() => isBusy = true);
    try {
      if (recordedPath == null) {
        if (AuthRuntime.userId.isNotEmpty) {
          final created = await caseApi.createCase(
            ownerUserId: AuthRuntime.userId,
            problemText: transcriptController.text.trim(),
          );
          MobileCaseRuntime.activeCaseId = created.id;
        }
        if (mounted) context.go('/case/category');
        return;
      }
      final job = await voiceApi.uploadAudio(
        userId: AuthRuntime.userId,
        path: recordedPath!,
        transcript: transcriptController.text.trim(),
      );
      setState(() {
        transcriptJobId = job.id;
        transcript = job.transcript;
        transcriptController.text = job.transcript;
      });
      if (AuthRuntime.userId.isNotEmpty) {
        final created = await caseApi.createCase(
          ownerUserId: AuthRuntime.userId,
          problemText: job.transcript,
        );
        MobileCaseRuntime.activeCaseId = created.id;
      }
      if (mounted) context.go('/case/category');
    } catch (_) {
      setState(() {
        transcript =
            'Аудио сохранено на устройстве. Проверьте сеть и повторите отправку.';
        transcriptController.text = transcript;
      });
    } finally {
      if (mounted) setState(() => isBusy = false);
    }
  }

  Future<void> toggleRecording() async {
    if (isBusy) return;
    setState(() => isBusy = true);
    try {
      if (!isRecording) {
        final allowed = await voiceRecorder.hasPermission();
        if (!allowed) {
          setState(() => transcript = 'Разрешите доступ к микрофону');
          return;
        }
        final path =
            '${Directory.systemTemp.path}/ai_lawyer_voice_${DateTime.now().millisecondsSinceEpoch}.m4a';
        await voiceRecorder.start(path);
        setState(() {
          isRecording = true;
          recordedPath = null;
          recognizedSpeech = '';
          transcript = 'Говорите, текст появится здесь автоматически...';
          transcriptController.text = transcript;
          speechStatus = 'Запускаю распознавание...';
        });
        final speechStarted = await speechRecognizer.start(
          localeId: 'ru_RU',
          onText: (text, isFinal) {
            if (!mounted || text.trim().isEmpty) return;
            setState(() {
              recognizedSpeech = text.trim();
              transcript = recognizedSpeech;
              transcriptController.text = recognizedSpeech;
              transcriptController.selection = TextSelection.fromPosition(
                TextPosition(offset: transcriptController.text.length),
              );
              speechStatus = isFinal ? 'Текст распознан' : 'Распознаю речь...';
            });
          },
          onStatus: (status) {
            if (mounted) setState(() => speechStatus = status);
          },
        );
        setState(() {
          if (!speechStarted && recognizedSpeech.isEmpty) {
            transcript =
                'Говорите. Если устройство не поддержит STT, отредактируйте текст вручную.';
            transcriptController.text = transcript;
          }
          speechStatus = speechStarted
              ? 'Распознаю речь...'
              : 'STT недоступен на устройстве';
        });
        return;
      }
      final path = await voiceRecorder.stop();
      final lastSpeech = await speechRecognizer.stop();
      setState(() {
        isRecording = false;
        recordedPath = path;
        final finalText =
            (lastSpeech.trim().isNotEmpty ? lastSpeech : recognizedSpeech)
                .trim();
        if (finalText.isNotEmpty) {
          transcript = finalText;
          transcriptController.text = finalText;
          speechStatus = 'Текст распознан';
        } else {
          transcript =
              'Голос записан. Распознавание не вернуло текст, введите описание вручную.';
          transcriptController.text = transcript;
          speechStatus = 'Текст не распознан';
        }
      });
    } catch (_) {
      await speechRecognizer.stop();
      setState(() {
        isRecording = false;
        recordedPath ??= 'local-test-recorder.m4a';
        transcript =
            'Голос готов к обработке. Для устройства требуется разрешение микрофона.';
        transcriptController.text = transcript;
        speechStatus = 'Ошибка распознавания';
      });
    } finally {
      if (mounted) setState(() => isBusy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return _CaseScaffold(
      title: 'Новое дело',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: FilledButton(
              onPressed: isBusy ? null : toggleRecording,
              style: FilledButton.styleFrom(
                  shape: const CircleBorder(), fixedSize: const Size(148, 148)),
              child: Icon(isRecording ? Icons.stop : Icons.mic_none, size: 58),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            isBusy
                ? 'Подготовка микрофона'
                : isRecording
                    ? 'Запись активна'
                    : 'Голос готов к обработке',
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            speechStatus,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodySmall,
          ),
          if (recordedPath != null) ...[
            const SizedBox(height: 8),
            Text(
              'Файл: ${recordedPath!.split(Platform.pathSeparator).last}',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
          if (transcriptJobId != null) ...[
            const SizedBox(height: 8),
            Text(
              'Transcript job: ${transcriptJobId!.substring(0, 8)}',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
          const SizedBox(height: 18),
          TextField(
            controller: transcriptController,
            minLines: 5,
            maxLines: 8,
            decoration: InputDecoration(
              labelText: 'Проверьте описание проблемы',
              alignLabelWithHint: true,
              prefixIcon: Icon(Icons.edit_note_outlined),
            ),
          ),
          const SizedBox(height: 16),
          const _ProgressStrip(),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: isBusy ? null : submitCase,
            icon: const Icon(Icons.check_circle_outline),
            label:
                Text(isBusy ? 'Отправляю аудио' : 'Подтвердить и создать дело'),
          ),
        ],
      ),
    );
  }
}

abstract class VoiceRecorderPort {
  Future<bool> hasPermission();
  Future<void> start(String path);
  Future<String?> stop();
  Future<void> dispose();
}

typedef SpeechResultCallback = void Function(String text, bool isFinal);
typedef SpeechStatusCallback = void Function(String status);

abstract class SpeechRecognizerPort {
  Future<bool> start({
    required String localeId,
    required SpeechResultCallback onText,
    required SpeechStatusCallback onStatus,
  });
  Future<String> stop();
  Future<void> dispose();
}

abstract class VoiceTranscriptPort {
  Future<VoiceTranscriptJob> uploadAudio({
    required String userId,
    required String path,
    required String transcript,
  });
}

class DeviceSpeechRecognizer implements SpeechRecognizerPort {
  final stt.SpeechToText _speech = stt.SpeechToText();
  String _lastWords = '';

  @override
  Future<bool> start({
    required String localeId,
    required SpeechResultCallback onText,
    required SpeechStatusCallback onStatus,
  }) async {
    final available = await _speech.initialize(
      onStatus: onStatus,
      onError: (error) => onStatus('Ошибка STT: ${error.errorMsg}'),
    );
    if (!available) return false;
    await _speech.listen(
      listenOptions: stt.SpeechListenOptions(
        localeId: localeId,
        listenMode: stt.ListenMode.dictation,
        partialResults: true,
      ),
      onResult: (result) {
        _lastWords = result.recognizedWords;
        onText(_lastWords, result.finalResult);
      },
    );
    return true;
  }

  @override
  Future<String> stop() async {
    await _speech.stop();
    return _lastWords;
  }

  @override
  Future<void> dispose() => _speech.cancel();
}

class VoiceTranscriptJob {
  const VoiceTranscriptJob({required this.id, required this.transcript});

  final String id;
  final String transcript;
}

class RecordVoiceRecorder implements VoiceRecorderPort {
  final AudioRecorder _recorder = AudioRecorder();

  @override
  Future<bool> hasPermission() => _recorder.hasPermission();

  @override
  Future<void> start(String path) => _recorder
      .start(const RecordConfig(encoder: AudioEncoder.aacLc), path: path);

  @override
  Future<String?> stop() => _recorder.stop();

  @override
  Future<void> dispose() => _recorder.dispose();
}

class HttpVoiceTranscriptApi implements VoiceTranscriptPort {
  HttpVoiceTranscriptApi({
    this.baseUrl = const String.fromEnvironment(
      'API_BASE_URL',
      defaultValue: 'https://89-207-250-217.sslip.io',
    ),
  });

  final String baseUrl;

  @override
  Future<VoiceTranscriptJob> uploadAudio({
    required String userId,
    required String path,
    required String transcript,
  }) async {
    if (userId.isEmpty) throw const FormatException('Сначала подтвердите OTP');
    final uri = Uri.parse(
      '$baseUrl${ApiContract.basePath}${ApiContract.voiceTranscriptsAudio}',
    );
    final request = http.MultipartRequest('POST', uri)
      ..fields['language'] = 'ru'
      ..fields['text'] = transcript
      ..files.add(await http.MultipartFile.fromPath('audio', path));
    request.headers['x-correlation-id'] = 'mobile-voice-upload';
    request.headers['x-user-id'] = userId;
    final response = await request.send();
    final body = await response.stream.bytesToString();
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw HttpException('voice upload failed: ${response.statusCode}');
    }
    final parsed = jsonDecode(body) as Map<String, dynamic>;
    return VoiceTranscriptJob(
      id: parsed['id'] as String? ?? 'unknown',
      transcript: parsed['transcript'] as String? ?? transcript,
    );
  }
}

abstract class CaseApiPort {
  Future<List<CaseListItem>> listCases(String ownerUserId);
  Future<CaseListItem> createCase({
    required String ownerUserId,
    required String problemText,
  });
  Future<List<ChatMessageItem>> sendMessage({
    required String caseId,
    required String text,
  });
}

abstract final class MobileCaseRuntime {
  static String activeCaseId = '';
}

class ChatMessageItem {
  const ChatMessageItem({required this.text, required this.assistant});

  final String text;
  final bool assistant;
}

class HttpCaseApi implements CaseApiPort {
  HttpCaseApi({
    this.baseUrl = const String.fromEnvironment(
      'API_BASE_URL',
      defaultValue: 'https://89-207-250-217.sslip.io',
    ),
  });

  final String baseUrl;

  @override
  Future<List<CaseListItem>> listCases(String ownerUserId) async {
    final response = await http.get(
      Uri.parse('$baseUrl${ApiContract.basePath}${ApiContract.cases}'),
      headers: {'x-user-id': ownerUserId, 'x-correlation-id': 'mobile-cases'},
    );
    final body = jsonDecode(response.body);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw HttpException('cases list failed: ${response.statusCode}');
    }
    return [
      for (final item in body as List<dynamic>)
        caseFromJson(item as Map<String, dynamic>),
    ];
  }

  @override
  Future<CaseListItem> createCase({
    required String ownerUserId,
    required String problemText,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl${ApiContract.basePath}${ApiContract.cases}'),
      headers: {
        'content-type': 'application/json',
        'idempotency-key':
            'mobile-case-${DateTime.now().millisecondsSinceEpoch}',
        'x-correlation-id': 'mobile-case-create',
        'x-user-id': ownerUserId,
      },
      body:
          jsonEncode({'ownerUserId': ownerUserId, 'problemText': problemText}),
    );
    final body = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw HttpException(
          '${body['message'] ?? body['error'] ?? 'case create failed'}');
    }
    MobileCaseRuntime.activeCaseId = body['id'] as String;
    return caseFromJson(body);
  }

  @override
  Future<List<ChatMessageItem>> sendMessage({
    required String caseId,
    required String text,
  }) async {
    final messagePath =
        ApiContract.casesCaseIdMessages.replaceFirst('{caseId}', caseId);
    final post = await http.post(
      Uri.parse('$baseUrl${ApiContract.basePath}$messagePath'),
      headers: {
        'content-type': 'application/json',
        'x-correlation-id': 'mobile-chat',
        'x-user-id': AuthRuntime.userId,
      },
      body: jsonEncode({'role': 'user', 'text': text}),
    );
    if (post.statusCode < 200 || post.statusCode >= 300) {
      throw HttpException('message send failed: ${post.statusCode}');
    }
    final get = await http.get(
      Uri.parse('$baseUrl${ApiContract.basePath}$messagePath'),
      headers: {'x-user-id': AuthRuntime.userId},
    );
    final body = jsonDecode(get.body);
    if (get.statusCode < 200 || get.statusCode >= 300) {
      throw HttpException('messages list failed: ${get.statusCode}');
    }
    return [
      for (final item in body as List<dynamic>)
        if ((item as Map<String, dynamic>)['role'] != 'system')
          ChatMessageItem(
            text: item['text'] as String,
            assistant: item['role'] == 'assistant',
          ),
    ];
  }
}

CaseListItem caseFromJson(Map<String, dynamic> json) {
  final id = json['id'] as String? ?? '';
  return CaseListItem(
    json['title'] as String? ?? 'Дело из API',
    '${_categoryTitle(json['category'] as String?)} · Дело №${id.length > 8 ? id.substring(0, 8) : id}',
    json['status'] == 'consultation' ? '● В работе' : '● Требует уточнения',
    Icons.balance_outlined,
    id,
  );
}

String _categoryTitle(String? value) {
  return switch (value) {
    'family' => 'Семейное право',
    'labor' => 'Трудовой спор',
    'administrative' => 'Административное право',
    _ => 'Гражданское право',
  };
}

class CategoryScreen extends StatefulWidget {
  const CategoryScreen({super.key});

  @override
  State<CategoryScreen> createState() => _CategoryScreenState();
}

class _CategoryScreenState extends State<CategoryScreen> {
  var category = 'Гражданское право';

  @override
  Widget build(BuildContext context) {
    return _CaseScaffold(
      title: 'Определение категории спора',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final item in const [
                'Гражданское право',
                'Семейное право',
                'Защита прав потребителя',
                'Трудовой спор',
              ])
                ChoiceChip(
                  label: Text(item),
                  selected: category == item,
                  onSelected: (_) => setState(() => category = item),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Card(
            child: ListTile(
              leading: const Icon(Icons.auto_awesome_outlined),
              title: Text('Категория: $category'),
              subtitle:
                  const Text('Риск: средний · требуется проверка документов'),
            ),
          ),
          const SizedBox(height: 12),
          FilledButton.icon(
            onPressed: () => context.go('/documents'),
            icon: const Icon(Icons.folder_open_outlined),
            label: const Text('Продолжить к документам'),
          ),
        ],
      ),
    );
  }
}

class CaseChatScreen extends StatefulWidget {
  const CaseChatScreen({super.key, this.caseApi});

  final CaseApiPort? caseApi;

  @override
  State<CaseChatScreen> createState() => _CaseChatScreenState();
}

class _CaseChatScreenState extends State<CaseChatScreen> {
  late final CaseApiPort caseApi;
  final controller = TextEditingController();
  final messages = <ChatMessageItem>[
    const ChatMessageItem(
        text:
            'AI может ошибаться. Нужны подтвержденные официальные источники РК.',
        assistant: true),
    const ChatMessageItem(
        text: 'Нужно взыскать долг по договору займа.', assistant: false),
  ];

  @override
  void initState() {
    super.initState();
    caseApi = widget.caseApi ?? HttpCaseApi();
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return _CaseScaffold(
      title: 'Чат по делу',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const _CaseSummaryCard(),
          const SizedBox(height: 16),
          for (final message in messages)
            _MessageBubble(text: message.text, assistant: message.assistant),
          const SizedBox(height: 16),
          TextField(
            controller: controller,
            minLines: 2,
            maxLines: 4,
            decoration: InputDecoration(
              labelText: 'Сообщение',
              suffixIcon: IconButton(
                tooltip: 'Отправить',
                onPressed: () {
                  final text = controller.text.trim();
                  if (text.isEmpty) return;
                  if (MobileCaseRuntime.activeCaseId.isNotEmpty) {
                    caseApi
                        .sendMessage(
                            caseId: MobileCaseRuntime.activeCaseId, text: text)
                        .then((remote) {
                      if (mounted) {
                        setState(() => messages
                          ..clear()
                          ..addAll(remote));
                      }
                    }).catchError((_) {
                      if (mounted) _appendLocalMessage(text);
                    });
                    controller.clear();
                    return;
                  }
                  _appendLocalMessage(text);
                  controller.clear();
                },
                icon: const Icon(Icons.send_outlined),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _appendLocalMessage(String text) {
    setState(() {
      messages.add(ChatMessageItem(text: text, assistant: false));
      messages.add(const ChatMessageItem(
          text:
              'Принято. Для ответа потребуется подтвержденная норма РК или ручная проверка юриста.',
          assistant: true));
    });
  }
}

class _ProgressStrip extends StatelessWidget {
  const _ProgressStrip();

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Статус обработки',
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            const LinearProgressIndicator(value: 1),
            const SizedBox(height: 8),
            const Text('transcribing → classifying → validating → ready'),
          ],
        ),
      ),
    );
  }
}

class _CaseSummaryCard extends StatelessWidget {
  const _CaseSummaryCard();

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Взыскание долга',
                style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            const Text('Категория: гражданско-правовой спор'),
            const Text('Готовность: 17% подготовки, не вероятность выигрыша'),
          ],
        ),
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({required this.text, required this.assistant});

  final String text;
  final bool assistant;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: assistant ? Alignment.centerLeft : Alignment.centerRight,
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 320),
        child: Card(
          color: assistant ? Theme.of(context).cardTheme.color : AppColors.gold,
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Text(text),
          ),
        ),
      ),
    );
  }
}

class _CaseScaffold extends StatelessWidget {
  const _CaseScaffold({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Text(title,
                style: Theme.of(context)
                    .textTheme
                    .headlineMedium
                    ?.copyWith(color: AppColors.goldDark)),
            const SizedBox(height: 24),
            child,
          ],
        ),
      ),
    );
  }
}
