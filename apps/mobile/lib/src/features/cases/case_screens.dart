import 'dart:convert';
import 'dart:async';
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
import '../../widgets/aizan_design.dart';

const caseCategoryLabels = {
  'family': 'Семейные споры',
  'civil_contract': 'Договоры и долги',
  'labor': 'Трудовые споры',
  'housing': 'Жилищные споры',
  'property_real_estate': 'Имущество и недвижимость',
  'land': 'Земельные споры',
  'inheritance': 'Наследство',
  'consumer': 'Защита потребителей',
  'banking_credit': 'Банки, кредиты и МФО',
  'insurance': 'Страховые споры',
  'tort_damage': 'Вред и компенсация',
  'corporate_commercial': 'Бизнес и корпоративные споры',
  'bankruptcy_rehabilitation': 'Банкротство и реабилитация',
  'tax_customs': 'Налоги и таможня',
  'ip_copyright': 'Интеллектуальная собственность',
  'medical': 'Медицинские споры',
  'administrative_public_law': 'Спор с госорганом',
  'administrative_offense': 'Административное правонарушение',
  'criminal': 'Уголовное дело',
  'enforcement': 'Исполнительное производство',
  'migration': 'Миграционные вопросы',
  'special_proceeding': 'Особое производство',
  'order_proceeding': 'Судебный приказ',
  'mediation_settlement': 'Медиация и мировое соглашение',
  'clarification_required': 'Требует уточнения',
};

const categoryAlternatives = [
  'Расторжение брака',
  'Содержание супруги',
  'Семейные споры',
  'Договоры и долги',
  'Трудовые споры',
  'Спор с госорганом',
  'Административное правонарушение',
  'Имущество и недвижимость',
  'Наследство',
  'Банки, кредиты и МФО',
];

class CasesListScreen extends StatefulWidget {
  const CasesListScreen({super.key, this.caseApi});

  final CaseApiPort? caseApi;

  @override
  State<CasesListScreen> createState() => _CasesListScreenState();
}

class _CasesListScreenState extends State<CasesListScreen> {
  late final CaseApiPort caseApi;
  var selectedFilter = 'Все';
  var status = 'Данные из БД еще не загружены';
  var cases = const <CaseListItem>[];
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
        cases = remote;
        status = remote.isEmpty
            ? 'В БД пока нет дел'
            : 'Дела загружены из API: ${remote.length}';
      });
    } catch (error) {
      setState(() => status = 'Cases API ошибка: $error');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const AizanHeader(newCase: true),
      bottomNavigationBar: const AppBottomNav(selectedIndex: 1),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Row(children: [
              Expanded(child: Text('Мои дела', style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontFamily: 'AizanSans', fontSize: 32))),
              IconButton(tooltip: 'Поиск дела', icon: const Icon(Icons.search), onPressed: () async {
                final title = await showSearch(context: context, delegate: _CaseSearchDelegate(cases));
                if (title == null || !mounted) return;
                final match = cases.where((item) => item.title == title).firstOrNull;
                if (match != null) { MobileCaseRuntime.selectCase(match); if (context.mounted) context.go('/case/details'); }
              }),
              IconButton(tooltip: 'Обновить из API', icon: const Icon(Icons.sync_outlined), onPressed: refreshCases),
            ]),
            const SizedBox(height: 14),
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
            const SizedBox(height: 18),
            if (cases.isEmpty)
              Card(
                child: ListTile(
                  leading: const CircleAvatar(child: Icon(Icons.add)),
                  title: const Text('Нет дел'),
                  subtitle: const Text(
                      'Создайте первое дело, чтобы оно появилось из БД'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    MobileCaseRuntime.startDraft();
                    context.go('/case/new');
                  },
                ),
              )
            else
              for (final item in cases.where((item) => selectedFilter == 'Все' ||
                  (selectedFilter == 'В работе' && item.status.toLowerCase().contains('работ')) ||
                  (selectedFilter == 'Суд' && item.status.toLowerCase().contains('суд')) ||
                  (selectedFilter == 'Претензии' && item.status.toLowerCase().contains('претенз'))))
                _ReferenceCaseListTile(
                  item: item,
                  onTap: () {
                    MobileCaseRuntime.selectCase(item);
                    context.go('/case/details');
                  },
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
            const _CaseDetailHero(),
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
  _CaseSearchDelegate(this.cases);

  final List<CaseListItem> cases;

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
    final items = cases
        .where((item) => item.title.toLowerCase().contains(query.toLowerCase()))
        .toList();
    return ListView(
      children: [
        if (items.isEmpty)
          const ListTile(
            title: Text('Нет дел'),
            subtitle: Text('Поиск работает только по данным из API/БД'),
          ),
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

class _ReferenceCaseListTile extends StatelessWidget {
  const _ReferenceCaseListTile({required this.item, required this.onTap});

  final CaseListItem item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 14),
      child: ListTile(
        minVerticalPadding: 18,
        onTap: onTap,
        leading: CircleAvatar(
          radius: 26,
          backgroundColor: AppColors.gold.withValues(alpha: 0.12),
          child: Icon(item.icon, color: AppColors.gold, size: 34),
        ),
        title: Text(item.title, style: Theme.of(context).textTheme.titleMedium),
        subtitle: Text('${item.subtitle}\n${item.status}'),
        trailing: const Icon(Icons.chevron_right, color: AppColors.gold),
        isThreeLine: true,
      ),
    );
  }
}

class _CaseDetailHero extends StatelessWidget {
  const _CaseDetailHero();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        CircleAvatar(
          radius: 48,
          backgroundColor: AppColors.gold.withValues(alpha: 0.12),
          child: const Icon(Icons.balance_outlined,
              size: 48, color: AppColors.gold),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                  MobileCaseRuntime.activeCaseId.isEmpty
                      ? 'Нет выбранного дела'
                      : MobileCaseRuntime.activeCaseTitle,
                  style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 4),
              Text(MobileCaseRuntime.activeCaseId.isEmpty
                  ? 'Откройте дело из списка API/БД'
                  : 'Дело №${MobileCaseRuntime.activeCaseId}'),
              const Text('● Только реальные данные'),
            ],
          ),
        ),
      ],
    );
  }
}

class _CaseMetrics extends StatelessWidget {
  const _CaseMetrics();

  @override
  Widget build(BuildContext context) {
    final hasCase = MobileCaseRuntime.activeCaseId.isNotEmpty;
    final metrics = [
      (
        Icons.menu_book_outlined,
        'Категория',
        hasCase ? MobileCaseRuntime.activeCaseSubtitle : 'Не загружена из БД'
      ),
      (
        Icons.gavel_outlined,
        'Статус',
        hasCase ? MobileCaseRuntime.activeCaseStatus : 'Нет выбранного дела'
      ),
      (Icons.account_balance_outlined, 'Маршрут', 'Assisted mode'),
      (Icons.calendar_month_outlined, 'Срок', 'Нет подтвержденного срока'),
      (Icons.donut_large_outlined, 'Готовность', hasCase ? 'Из API' : '0%'),
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
    final hasCase = MobileCaseRuntime.activeCaseId.isNotEmpty;
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: [
        _InfoCard(
            title: 'Участники дела',
            body: hasCase
                ? 'Участники не внесены в базу по этому делу'
                : 'Откройте дело из списка API/БД'),
        _InfoCard(
            title: 'Сумма и требования',
            body: hasCase
                ? 'Сумма не указана в данных дела'
                : 'Нет выбранного дела'),
        _InfoCard(
            title: 'Документы',
            body: hasCase
                ? 'Документы загружаются на экране документов'
                : 'Нет выбранного дела'),
        _InfoCard(
            title: 'Ключевые даты',
            body: hasCase
                ? 'Подтвержденные даты не указаны'
                : 'Нет выбранного дела'),
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

class _NewCaseScreenState extends State<NewCaseScreen> {
  late final TextEditingController transcriptController;
  late final VoiceRecorderPort voiceRecorder;
  late final SpeechRecognizerPort speechRecognizer;
  late final VoiceTranscriptPort voiceApi;
  late final CaseApiPort caseApi;
  var isRecording = false;
  var isPaused = false;
  var elapsedSeconds = 0;
  Timer? recordingTimer;
  var isBusy = false;
  String? recordedPath;
  String? transcriptJobId;
  var speechStatus = 'Распознавание не запущено';
  var recognizedSpeech = '';
  var speechPrefix = '';
  var transcript = '';

  @override
  void initState() {
    super.initState();
    voiceRecorder = widget.recorder ?? RecordVoiceRecorder();
    speechRecognizer = widget.speechRecognizer ?? DeviceSpeechRecognizer();
    voiceApi = widget.voiceApi ?? HttpVoiceTranscriptApi();
    caseApi = widget.caseApi ?? HttpCaseApi();
    transcript = MobileCaseRuntime.confirmedText;
    transcriptController = TextEditingController(text: transcript);
    transcriptController.addListener(() => MobileCaseRuntime.confirmedText = transcriptController.text);
    if (MobileCaseRuntime.preferVoiceInput) {
      WidgetsBinding.instance.addPostFrameCallback((_) { if (mounted) toggleRecording(); });
    }
  }

  @override
  void dispose() {
    recordingTimer?.cancel();
    transcriptController.dispose();
    voiceRecorder.dispose();
    speechRecognizer.dispose();
    super.dispose();
  }

  Future<void> submitCase() async {
    if (isBusy) return;
    setState(() => isBusy = true);
    try {
      final confirmedText = transcriptController.text.trim();
      if (confirmedText.length < 12) {
        setState(() => speechStatus = 'Опишите ситуацию подробнее: минимум 12 символов.');
        return;
      }
      if (recordedPath == null) {
        MobileCaseRuntime.confirmedText = confirmedText;
        if (mounted) context.go('/case/category');
        return;
      }
      if (AuthRuntime.userId.isEmpty) {
        MobileCaseRuntime.confirmedText = confirmedText;
        setState(() {
          speechStatus = 'Текст распознан локально. Войдите для синхронизации';
        });
        if (mounted) context.go('/case/category');
        return;
      }
      final job = await voiceApi.uploadAudio(
        userId: AuthRuntime.userId,
        path: recordedPath!,
        transcript: confirmedText,
      ).timeout(const Duration(seconds: 8));
      setState(() {
        transcriptJobId = job.id;
        transcript = job.transcript;
        transcriptController.text = job.transcript;
      });
      MobileCaseRuntime.confirmedText = job.transcript;
      if (mounted) context.go('/case/category');
    } catch (_) {
      MobileCaseRuntime.confirmedText = transcriptController.text.trim();
      if (mounted) setState(() => speechStatus = 'Текст сохранен. Не удалось отправить аудио: проверьте сеть и повторите.');
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
          setState(() => speechStatus = 'Разрешите доступ к микрофону');
          return;
        }
        final path =
            '${Directory.systemTemp.path}/ai_lawyer_voice_${DateTime.now().millisecondsSinceEpoch}.m4a';
        await voiceRecorder.start(path);
        recordingTimer?.cancel();
        recordingTimer = Timer.periodic(const Duration(seconds: 1), (_) {
          if (mounted && isRecording && !isPaused) setState(() => elapsedSeconds++);
        });
        setState(() {
          isRecording = true;
          isPaused = false;
          elapsedSeconds = 0;
          recordedPath = null;
          speechPrefix = transcriptController.text.trim();
          recognizedSpeech = '';
          speechStatus = 'Запускаю распознавание...';
        });
        final speechStarted = await speechRecognizer.start(
          localeId: 'ru_RU',
          onText: (text, isFinal) {
            if (!mounted || text.trim().isEmpty) return;
            setState(() {
              recognizedSpeech = text.trim();
              transcript = [speechPrefix, recognizedSpeech].where((part) => part.isNotEmpty).join('\n');
              transcriptController.text = transcript;
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
            speechStatus = 'Распознавание недоступно. Введите текст вручную.';
          }
          speechStatus = speechStarted
              ? 'Распознаю речь...'
              : 'STT недоступен на устройстве';
        });
        return;
      }
      final path = await voiceRecorder.stop();
      recordingTimer?.cancel();
      final lastSpeech = await speechRecognizer.stop();
      setState(() {
        isRecording = false;
        isPaused = false;
        recordedPath = path;
        final finalText =
            (lastSpeech.trim().isNotEmpty ? lastSpeech : recognizedSpeech)
                .trim();
        if (finalText.isNotEmpty) {
          transcript = [speechPrefix, finalText].where((part) => part.isNotEmpty).join('\n');
          transcriptController.text = transcript;
          speechStatus = 'Текст распознан';
        } else {
          speechStatus = 'Текст не распознан';
        }
      });
    } catch (_) {
      recordingTimer?.cancel();
      await speechRecognizer.stop();
      try { await voiceRecorder.stop(); } catch (_) { /* No active recorder. */ }
      if (mounted) setState(() {
        isRecording = false;
        isPaused = false;
        speechStatus = 'Запись недоступна. Текст сохранён: проверьте микрофон или введите текст.';
      });
    } finally {
      if (mounted) setState(() => isBusy = false);
    }
  }

  Future<void> pauseRecording() async {
    final recorder = voiceRecorder;
    if (recorder is! PausableVoiceRecorderPort || !isRecording || isBusy) return;
    try {
      if (isPaused) {
        speechPrefix = transcriptController.text.trim();
        await recorder.resume();
        await speechRecognizer.start(localeId: 'ru_RU', onText: (text, isFinal) {
          if (mounted && text.trim().isNotEmpty) setState(() {
            recognizedSpeech = text;
            transcriptController.text = [speechPrefix, text].where((part) => part.isNotEmpty).join('\n');
            speechStatus = isFinal ? 'Текст распознан' : 'Распознаю речь...';
          });
        }, onStatus: (status) { if (mounted) setState(() => speechStatus = status); });
      }
      else { await recorder.pause(); await speechRecognizer.stop(); }
      if (mounted) setState(() => isPaused = !isPaused);
    } catch (_) {
      if (mounted) setState(() => speechStatus = 'Не удалось изменить состояние записи.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final timer = '${(elapsedSeconds ~/ 60).toString().padLeft(2, '0')}:${(elapsedSeconds % 60).toString().padLeft(2, '0')}';
    return _CaseScaffold(
      title: 'Новое дело', showTitle: false,
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Center(child: Semantics(button: true, label: isRecording ? 'Остановить запись' : 'Записать голос',
          child: InkWell(onTap: isBusy ? null : toggleRecording,
            child: const AizanArt(AizanArtwork.voice, width: 330)))),
        const SizedBox(height: 18),
        const Text('Опишите проблему', textAlign: TextAlign.center, style: TextStyle(fontSize: 23)),
        const SizedBox(height: 6),
        Text(isRecording ? (isPaused ? 'Запись на паузе' : 'Нажмите и говорите') : 'Нажмите микрофон или введите текст',
          textAlign: TextAlign.center, style: const TextStyle(color: AppColors.muted, fontSize: 14)),
        const SizedBox(height: 22),
        Card(child: Padding(padding: const EdgeInsets.all(14), child: Column(children: [
          Row(children: [
            Expanded(child: Icon(Icons.graphic_eq, size: 42, color: isRecording ? AppColors.goldDark : AppColors.muted)),
            Text(timer, style: const TextStyle(color: AppColors.goldDark)),
          ]),
          const SizedBox(height: 10),
          TextField(controller: transcriptController, minLines: 3, maxLines: 6,
            autofocus: !MobileCaseRuntime.preferVoiceInput,
            decoration: const InputDecoration(labelText: 'Проверьте описание проблемы', alignLabelWithHint: true)),
        ]))),
        const SizedBox(height: 18),
        Row(children: [
          Expanded(flex: 3, child: AizanButton(label: isRecording ? 'Завершить запись' : 'Начать запись',
            onPressed: isBusy ? null : toggleRecording, icon: isRecording ? Icons.stop : Icons.mic_none)),
          const SizedBox(width: 10),
          Expanded(flex: 2, child: OutlinedButton.icon(
            onPressed: isRecording && voiceRecorder is PausableVoiceRecorderPort ? pauseRecording : null,
            icon: Icon(isPaused ? Icons.play_arrow : Icons.pause), label: Text(isPaused ? 'Продолжить' : 'Пауза'))),
        ]),
        const SizedBox(height: 12),
        Text(speechStatus, textAlign: TextAlign.center, style: const TextStyle(fontSize: 12, color: AppColors.muted)),
        const SizedBox(height: 12),
        if (!isRecording) AizanButton(label: isBusy ? 'Отправляю аудио' : 'Подтвердить текст', onPressed: isBusy ? null : submitCase, icon: Icons.check_circle_outline),
      ]),
    );
  }
}

abstract class VoiceRecorderPort {
  Future<bool> hasPermission();
  Future<void> start(String path);
  Future<String?> stop();
  Future<void> dispose();
}

abstract class PausableVoiceRecorderPort implements VoiceRecorderPort {
  Future<void> pause();
  Future<void> resume();
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

class RecordVoiceRecorder implements PausableVoiceRecorderPort {
  final AudioRecorder _recorder = AudioRecorder();

  @override
  Future<bool> hasPermission() => _recorder.hasPermission();

  @override
  Future<void> start(String path) => _recorder
      .start(const RecordConfig(encoder: AudioEncoder.aacLc), path: path);

  @override
  Future<String?> stop() => _recorder.stop();

  @override
  Future<void> pause() => _recorder.pause();
  @override
  Future<void> resume() => _recorder.resume();

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
  Future<CaseClassificationResult> classifyDispute({
    required String ownerUserId,
    required String text,
  });
  Future<CaseClassificationResult> confirmClassification({
    required String ownerUserId,
    required String classificationId,
  });
  Future<CaseClassificationResult> overrideClassification({
    required String ownerUserId,
    required String classificationId,
    required String subcategoryCode,
  });
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
  static bool preferVoiceInput = false;
  static String activeCaseId = '';
  static String activeCaseTitle = '';
  static String activeCaseSubtitle = '';
  static String activeCaseStatus = '';
  static String confirmedText = '';
  static String draftCaseId = 'draft-initial';
  static String createdDraftCaseId = '';

  static bool get currentDraftCreated =>
      activeCaseId.isNotEmpty && createdDraftCaseId == draftCaseId;

  static void startDraft() {
    draftCaseId = 'draft-${DateTime.now().microsecondsSinceEpoch}';
    createdDraftCaseId = '';
    activeCaseId = '';
    activeCaseTitle = '';
    activeCaseSubtitle = '';
    activeCaseStatus = '';
    confirmedText = '';
    preferVoiceInput = false;
  }

  static void selectCase(CaseListItem item) {
    activeCaseId = item.id;
    activeCaseTitle = item.title;
    activeCaseSubtitle = item.subtitle;
    activeCaseStatus = item.status;
  }

  static void markCreated(String caseId) {
    activeCaseId = caseId;
    activeCaseTitle = 'Дело из БД';
    activeCaseSubtitle = 'Создано из подтвержденного текста';
    activeCaseStatus = '● В работе';
    createdDraftCaseId = draftCaseId;
  }
}

class CaseClassificationResult {
  const CaseClassificationResult({
    required this.id,
    required this.categoryLabel,
    required this.subcategoryLabel,
    required this.subcategoryCode,
    required this.confidence,
    required this.missingFacts,
    required this.alternatives,
    required this.riskLevel,
    required this.requiredHumanReview,
  });

  final String id;
  final String categoryLabel;
  final String subcategoryLabel;
  final String subcategoryCode;
  final double confidence;
  final List<String> missingFacts;
  final List<String> alternatives;
  final String riskLevel;
  final bool requiredHumanReview;
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
  Future<CaseClassificationResult> classifyDispute({
    required String ownerUserId,
    required String text,
  }) async {
    final response = await http.post(
      Uri.parse(
          '$baseUrl${ApiContract.basePath}${ApiContract.aiClassifications}'),
      headers: {
        'content-type': 'application/json',
        'x-correlation-id': 'mobile-classification',
        'x-user-id': ownerUserId,
      },
      body: jsonEncode({'text': text}),
    );
    return classificationFromResponse(response);
  }

  @override
  Future<CaseClassificationResult> confirmClassification({
    required String ownerUserId,
    required String classificationId,
  }) async {
    final path = ApiContract.aiClassificationsIdConfirm
        .replaceFirst('{id}', classificationId);
    final response = await http.post(
      Uri.parse('$baseUrl${ApiContract.basePath}$path'),
      headers: {
        'content-type': 'application/json',
        'idempotency-key':
            'mobile-category-confirm-${DateTime.now().millisecondsSinceEpoch}',
        'x-correlation-id': 'mobile-category-confirm',
        'x-user-id': ownerUserId,
      },
      body: jsonEncode({}),
    );
    return classificationFromResponse(response);
  }

  @override
  Future<CaseClassificationResult> overrideClassification({
    required String ownerUserId,
    required String classificationId,
    required String subcategoryCode,
  }) async {
    final path = ApiContract.aiClassificationsIdOverride
        .replaceFirst('{id}', classificationId);
    final response = await http.post(
      Uri.parse('$baseUrl${ApiContract.basePath}$path'),
      headers: {
        'content-type': 'application/json',
        'x-correlation-id': 'mobile-category-override',
        'x-user-id': ownerUserId,
      },
      body: jsonEncode({
        'subcategoryCode': subcategoryCode,
        'reason': 'mobile manual selection',
      }),
    );
    return classificationFromResponse(response);
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
    MobileCaseRuntime.markCreated(body['id'] as String);
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

CaseClassificationResult classificationFromResponse(http.Response response) {
  final body = jsonDecode(response.body) as Map<String, dynamic>;
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw HttpException(
        '${body['message'] ?? body['error'] ?? 'classification failed'}');
  }
  final result = body['result'] as Map<String, dynamic>;
  return CaseClassificationResult(
    id: body['id'] as String,
    categoryLabel: result['category_label'] as String? ?? 'Категория',
    subcategoryLabel:
        result['subcategory_label'] as String? ?? 'Требуется уточнение',
    subcategoryCode:
        result['subcategory_code'] as String? ?? 'clarification_required.other',
    confidence: ((result['confidence'] as num?) ?? 0).toDouble(),
    missingFacts: [
      for (final item in (result['missing_facts'] as List<dynamic>? ?? []))
        '$item',
    ],
    alternatives: [
      for (final item in (result['alternatives'] as List<dynamic>? ?? []))
        '${(item as Map<String, dynamic>)['code']}',
    ],
    riskLevel: result['risk_level'] as String? ?? 'medium',
    requiredHumanReview: result['required_human_review'] == true,
  );
}

String _categoryTitle(String? value) {
  return caseCategoryLabels[value] ?? 'Требует уточнения';
}

class CategoryScreen extends StatefulWidget {
  const CategoryScreen({super.key, this.caseApi});

  final CaseApiPort? caseApi;

  @override
  State<CategoryScreen> createState() => _CategoryScreenState();
}

class _CategoryScreenState extends State<CategoryScreen> {
  late final CaseApiPort caseApi;
  late final TextEditingController answerController;
  CaseClassificationResult? classification;
  var status = 'Готовлю анализ категории';
  var isBusy = false;

  @override
  void initState() {
    super.initState();
    caseApi = widget.caseApi ?? HttpCaseApi();
    answerController = TextEditingController();
    WidgetsBinding.instance.addPostFrameCallback((_) => classify());
  }

  @override
  void dispose() {
    answerController.dispose();
    super.dispose();
  }

  int progressValue() {
    if (MobileCaseRuntime.currentDraftCreated) return 100;
    if (classification != null) {
      return classification!.missingFacts.isNotEmpty ? 64 : 72;
    }
    if (isBusy) return 45;
    if (MobileCaseRuntime.confirmedText.trim().isNotEmpty) return 25;
    return 10;
  }

  List<({String title, bool done})> timeline() {
    final result = classification;
    return [
      (
        title: '1. Описание',
        done: MobileCaseRuntime.confirmedText.trim().isNotEmpty
      ),
      (
        title: '2. Уточнения AI',
        done: result != null && result.missingFacts.isEmpty
      ),
      (title: '3. Документы', done: false),
      (title: '4. Категория', done: result != null),
      (title: '5. Дело', done: MobileCaseRuntime.currentDraftCreated),
    ];
  }

  String nextAiQuestion() {
    final missing = classification?.missingFacts.firstOrNull;
    if (missing == null) {
      return classification == null
          ? 'Проверю описание, определю категорию и скажу, каких фактов не хватает.'
          : 'Подтвердите категорию, и я создам дело в базе данных.';
    }
    if (missing == 'employer') {
      return 'Укажите работодателя, должность и период, за который возник спор.';
    }
    if (missing == 'contract_date') {
      return 'Уточните дату договора, сумму и что именно не оплатил заказчик.';
    }
    return 'Уточните недостающий факт: $missing.';
  }

  void appendAnswer() {
    final value = answerController.text.trim();
    if (value.isEmpty) {
      setState(() => status = 'Введите ответ для AI');
      return;
    }
    MobileCaseRuntime.confirmedText =
        '${MobileCaseRuntime.confirmedText.trim()}\nУточнение: $value'.trim();
    answerController.clear();
    setState(() {
      classification = null;
      status = 'Ответ добавлен. Повторите анализ AI.';
    });
  }

  Future<void> classify() async {
    if (isBusy) return;
    final text = MobileCaseRuntime.confirmedText.trim();
    if (AuthRuntime.userId.isEmpty) {
      setState(() => status = 'Войдите, чтобы сохранить категорию в БД');
      return;
    }
    if (text.length < 4) {
      setState(() => status = 'Вернитесь и подтвердите текст обращения');
      return;
    }
    setState(() {
      isBusy = true;
      status = 'Анализирую категорию через API...';
    });
    try {
      final result = await caseApi.classifyDispute(
          ownerUserId: AuthRuntime.userId, text: text);
      setState(() {
        classification = result;
        status = 'Категория определена';
      });
    } catch (error) {
      setState(() => status = 'Ошибка классификации: $error');
    } finally {
      if (mounted) setState(() => isBusy = false);
    }
  }

  Future<void> confirmAndCreate() async {
    final result = classification;
    if (isBusy || result == null || AuthRuntime.userId.isEmpty) return;
    if (result.missingFacts.isNotEmpty) {
      setState(() => status = 'Сначала ответьте на вопросы AI');
      return;
    }
    setState(() {
      isBusy = true;
      status = 'Подтверждаю категорию и создаю дело...';
    });
    try {
      await caseApi.confirmClassification(
          ownerUserId: AuthRuntime.userId, classificationId: result.id);
      final created = await caseApi.createCase(
        ownerUserId: AuthRuntime.userId,
        problemText:
            '${MobileCaseRuntime.confirmedText}\nКатегория: ${result.subcategoryCode}',
      );
      MobileCaseRuntime.markCreated(created.id);
      if (mounted) context.go('/case/details');
    } catch (error) {
      setState(() => status = 'Ошибка сохранения: $error');
    } finally {
      if (mounted) setState(() => isBusy = false);
    }
  }

  Future<void> overrideCategory(String code) async {
    final result = classification;
    if (isBusy || result == null || AuthRuntime.userId.isEmpty) return;
    setState(() => isBusy = true);
    try {
      final updated = await caseApi.overrideClassification(
        ownerUserId: AuthRuntime.userId,
        classificationId: result.id,
        subcategoryCode: code,
      );
      setState(() {
        classification = updated;
        status = 'Категория изменена вручную';
      });
    } catch (error) {
      setState(() => status = 'Ошибка ручного выбора: $error');
    } finally {
      if (mounted) setState(() => isBusy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final result = classification;
    return _CaseScaffold(
      title: 'Категория определена',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Card(child: Padding(padding: const EdgeInsets.all(22), child: Column(children: [
            const Icon(Icons.balance_outlined, size: 64, color: AizanDesign.gold),
            const SizedBox(height: 18),
            Text(result?.categoryLabel ?? 'Категория пока не определена', textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 10),
            Text(result?.subcategoryLabel ?? 'Запустите анализ вашего обращения', textAlign: TextAlign.center),
            if (result != null) ...[const SizedBox(height: 14), Text('Уверенность: ${(result.confidence * 100).round()}%')],
          ]))),
          const SizedBox(height: 18),
          Text(status),
          if (result?.missingFacts.isNotEmpty == true) Text(nextAiQuestion()),
          if (result?.missingFacts.isNotEmpty == true) ...[
            const SizedBox(height: 12),
            TextField(
              controller: answerController,
              minLines: 2,
              maxLines: 4,
              decoration: const InputDecoration(
                labelText: 'Ответьте AI',
                hintText: 'Дата, сумма, участники, документ...',
              ),
            ),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: appendAnswer,
              icon: const Icon(Icons.reply_outlined),
              label: const Text('Добавить ответ'),
            ),
          ],
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: isBusy || classification == null
                ? null
                : classification!.missingFacts.isNotEmpty
                    ? () => setState(
                        () => status = 'Сначала ответьте на вопросы AI')
                    : confirmAndCreate,
            icon: const Icon(Icons.auto_awesome),
            label: Text(classification?.missingFacts.isNotEmpty == true
                ? 'Ответьте AI'
                : isBusy
                    ? 'Сохраняю'
                    : 'Продолжить'),
          ),
          TextButton(
            onPressed: isBusy ? null : classify,
            child: const Text('Повторить анализ'),
          ),
          const SizedBox(height: 12),
          _CategoryAlternatives(
            classification: result,
            onSelected: overrideCategory,
          ),
        ],
      ),
    );
  }
}

class _CategoryAlternatives extends StatelessWidget {
  const _CategoryAlternatives({
    required this.classification,
    required this.onSelected,
  });

  final CaseClassificationResult? classification;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    final result = classification;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text('Возможные альтернативы'),
        const SizedBox(height: 12),
        for (final item in (result?.alternatives.isNotEmpty == true
            ? result!.alternatives
            : categoryAlternatives))
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: OutlinedButton.icon(
              onPressed: result == null ? null : () => onSelected(item),
              icon: const Icon(Icons.timer_outlined),
              label: Text(item),
            ),
          ),
        if (result?.missingFacts.isNotEmpty == true)
          Text(
            'Не хватает данных: ${result!.missingFacts.join(', ')}',
            textAlign: TextAlign.center,
          ),
        const SizedBox(height: 8),
        const Text(
          'На основании вашего описания система определила наиболее подходящую категорию спора.',
          textAlign: TextAlign.center,
        ),
      ],
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
          FilledButton.icon(
            onPressed: () => context.go('/workflow/pretrial-claim'),
            icon: const Icon(Icons.auto_awesome_outlined),
            label: const Text('Сформировать документ'),
          ),
          const SizedBox(height: 12),
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
            Text(
                MobileCaseRuntime.activeCaseId.isEmpty
                    ? 'Нет выбранного дела'
                    : 'Дело из БД',
                style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(MobileCaseRuntime.activeCaseId.isEmpty
                ? 'Выберите реальное дело из списка'
                : 'ID из БД: ${MobileCaseRuntime.activeCaseId}'),
            const Text('Готовность рассчитывается после загрузки API-данных'),
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
  const _CaseScaffold({required this.title, required this.child, this.showTitle = true});

  final String title;
  final Widget child;
  final bool showTitle;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const AizanHeader(),
      bottomNavigationBar: title == 'Новое дело' ? const AppBottomNav(selectedIndex: 0) : null,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            if (showTitle) Text(title,
                style: Theme.of(context)
                    .textTheme
                    .headlineMedium
                    ?.copyWith(color: AppColors.goldDark)),
            if (showTitle) const SizedBox(height: 24),
            child,
          ],
        ),
      ),
    );
  }
}
