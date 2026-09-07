import 'package:ai_lawyer_kz/main.dart';
import 'package:ai_lawyer_kz/src/features/auth/auth_screens.dart';
import 'package:ai_lawyer_kz/src/features/cases/case_screens.dart';
import 'package:ai_lawyer_kz/src/features/documents/document_screens.dart';
import 'package:ai_lawyer_kz/src/features/legal/legal_screens.dart';
import 'package:ai_lawyer_kz/src/features/subscription/subscription_screen.dart';
import 'package:ai_lawyer_kz/src/features/workflows/workflow_screens.dart';
import 'package:ai_lawyer_kz/src/api/api_contract.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

void main() {
  setUp(() {
    AuthRuntime.otpId = '';
    AuthRuntime.otpCodeHint = null;
    AuthRuntime.userId = '';
    AuthRuntime.displayName = 'Тестовый пользователь';
    MobileCaseRuntime.activeCaseId = '';
    WorkflowRuntime.generatedBody = '';
  });

  test('generated API contract exposes auth and case paths', () {
    expect(ApiContract.authRegister, '/auth/register');
    expect(ApiContract.accountExport, '/account/export');
    expect(ApiContract.account, '/account');
    expect(ApiContract.cases, '/cases');
  });

  testWidgets('shows the main voice action', (tester) async {
    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pumpWidget(const AiLawyerApp());

    expect(find.text('Рассказать проблему'), findsOneWidget);
    await tester.drag(find.text('Рассказать проблему'), const Offset(0, -500));
    await tester.pumpAndSettle();
    expect(find.text('Последние дела'), findsOneWidget);
  });

  testWidgets('main voice button opens case intake route', (tester) async {
    await tester.pumpWidget(const AiLawyerApp());

    await tester.tap(find.byIcon(Icons.mic_none));
    await tester.pumpAndSettle();
    expect(find.text('Новое дело'), findsWidgets);
  });

  testWidgets('profile icon opens profile route', (tester) async {
    await tester.pumpWidget(const AiLawyerApp());

    await tester.tap(find.byKey(const ValueKey('home-profile')));
    await tester.pumpAndSettle();
    expect(find.text('Профиль пользователя'), findsWidgets);
  });

  testWidgets('onboarding buttons work', (tester) async {
    await tester.pumpWidget(const AiLawyerApp(initialLocation: '/onboarding'));
    await tester.pumpAndSettle();

    expect(find.text('AI Юрист Казахстан'), findsOneWidget);
    await tester.tap(find.text('Начать работу'));
    await tester.pumpAndSettle();
    expect(find.text('Вход и регистрация'), findsWidgets);

    await tester.pumpWidget(const AiLawyerApp(initialLocation: '/onboarding'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Войти в аккаунт'));
    await tester.pumpAndSettle();
    expect(find.text('Вход и регистрация'), findsWidgets);
  });

  testWidgets('registration otp and biometric flow works', (tester) async {
    await setLargeViewport(tester);
    final api = _FakeAuthApi();
    await tester.pumpWidget(MaterialApp.router(
      routerConfig: GoRouter(
        initialLocation: '/login',
        routes: [
          GoRoute(
              path: '/login', builder: (_, __) => LoginScreen(authApi: api)),
          GoRoute(
              path: '/register',
              builder: (_, __) => RegisterScreen(authApi: api)),
          GoRoute(path: '/otp', builder: (_, __) => OtpScreen(authApi: api)),
          GoRoute(
              path: '/biometric', builder: (_, __) => const BiometricScreen()),
        ],
      ),
    ));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Зарегистрироваться'));
    await tester.pumpAndSettle();
    expect(find.text('Регистрация пользователя'), findsWidgets);

    await tester.tap(find.text('Создать аккаунт'));
    await tester.pumpAndSettle();
    expect(api.registerCalled, isTrue);
    expect(find.text('RC local SMS: 111111'), findsOneWidget);
    await tester.tap(find.text('Подтвердить'));
    await tester.pumpAndSettle();
    expect(api.verifyCalled, isTrue);
    expect(find.text('Быстрый вход по биометрии'), findsWidgets);

    await tester.tap(find.text('Включить биометрию'));
    await tester.pumpAndSettle();
    expect(find.text('Включено'), findsOneWidget);
  });

  testWidgets('all release routes open through app router', (tester) async {
    await setLargeViewport(tester);
    const routes = [
      ['/', 'Рассказать проблему'],
      ['/onboarding', 'AI Юрист Казахстан'],
      ['/login', 'Вход и регистрация'],
      ['/register', 'Регистрация пользователя'],
      ['/otp', 'Подтверждение SMS'],
      ['/biometric', 'Быстрый вход по биометрии'],
      ['/profile', 'Профиль пользователя'],
      ['/settings', 'Настройки'],
      ['/help', 'Помощь и поддержка'],
      ['/cases', 'Мои дела'],
      ['/case/details', 'Карточка дела'],
      ['/case/new', 'Новое дело'],
      ['/case/category', 'Категория спора'],
      ['/case/chat', 'Чат по делу'],
      ['/documents', 'Документы и доказательства'],
      ['/documents/analysis', 'Анализ документов'],
      ['/deadlines', 'Календарь и сроки'],
      ['/legal', 'Официальные источники РК'],
      ['/workflow/pretrial-claim', 'Формирование претензии'],
      ['/workflow/pretrial-claim/draft', 'Проект досудебной претензии'],
      ['/workflow/pretrial-claim/send', 'Отправка претензии'],
      ['/subscription', 'Подписка'],
    ];

    for (final route in routes) {
      await tester.pumpWidget(AiLawyerApp(initialLocation: route[0]));
      await tester.pumpAndSettle();
      expect(find.text(route[1]), findsWidgets, reason: route[0]);
      expect(tester.takeException(), isNull, reason: route[0]);
    }
  });

  testWidgets('shows case intake screen', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: NewCaseScreen()));

    expect(find.text('Подтвердить и создать дело'), findsOneWidget);
  });

  testWidgets('case category flow opens documents', (tester) async {
    await setLargeViewport(tester);
    await tester.pumpWidget(const AiLawyerApp());
    await tester.pumpAndSettle();
    await tester.tap(find.text('Новое дело'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Подтвердить и создать дело'));
    await tester.pumpAndSettle();
    expect(find.text('Категория спора'), findsWidgets);

    await tester.tap(find.text('Содержание супруги'));
    await tester.pumpAndSettle();
    expect(find.text('Брачно-семейные отношения'), findsOneWidget);
  });

  testWidgets('bottom navigation opens cases documents deadlines and profile',
      (tester) async {
    await setLargeViewport(tester);
    await tester.pumpWidget(const AiLawyerApp());
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const ValueKey('nav-cases')));
    await tester.pumpAndSettle();
    expect(find.text('Мои дела'), findsWidgets);

    await tester.tap(find.byKey(const ValueKey('nav-documents')));
    await tester.pumpAndSettle();
    expect(find.text('Документы и доказательства'), findsWidgets);

    await tester.tap(find.byKey(const ValueKey('nav-deadlines')));
    await tester.pumpAndSettle();
    expect(find.text('Календарь и сроки'), findsOneWidget);

    await tester.tap(find.byKey(const ValueKey('nav-profile')));
    await tester.pumpAndSettle();
    expect(find.text('Профиль пользователя'), findsWidgets);
  });

  testWidgets('cases list filters search and opens case details',
      (tester) async {
    await setLargeViewport(tester);
    await tester.pumpWidget(const AiLawyerApp());
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Все дела'));
    await tester.tap(find.text('Все дела'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('В работе'));
    await tester.pumpAndSettle();
    expect(find.text('Взыскание долга'), findsOneWidget);

    await tester.tap(find.byTooltip('Поиск дела'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField), 'Алименты');
    await tester.pumpAndSettle();
    expect(find.text('Алименты'), findsWidgets);
    await tester.tap(find.byTooltip('Назад'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Взыскание долга').first);
    await tester.pumpAndSettle();
    expect(find.text('Карточка дела'), findsOneWidget);
    expect(find.text('Продолжить работу'), findsOneWidget);
  });

  testWidgets('shows documents OCR review screen', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: DocumentsScreen()));

    await tester.scrollUntilVisible(find.text('OCR-review'), 220);
    expect(find.text('OCR-review'), findsOneWidget);
    expect(find.text('Подтвердить поля'), findsOneWidget);
  });

  testWidgets('shows legal citation guardrails screen', (tester) async {
    final api = _FakeLegalApi();
    await tester
        .pumpWidget(MaterialApp(home: LegalSourcesScreen(legalApi: api)));

    expect(find.text('Официальные источники РК'), findsOneWidget);
    expect(find.text('Citation Validator'), findsOneWidget);

    await tester.tap(find.byTooltip('Найти норму'));
    await tester.pumpAndSettle();
    expect(find.text('Норма найдена'), findsOneWidget);
    expect(api.answeredQuery, 'взыскание долга по расписке');

    await tester.drag(find.byType(ListView), const Offset(0, -500));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Citation Validator'));
    await tester.pumpAndSettle();
    expect(find.text('Цитата проверена API'), findsOneWidget);
    expect(api.validatedFragmentId, 'fragment-1');
  });

  testWidgets('profile settings help and biometric actions work',
      (tester) async {
    await setLargeViewport(tester);
    await tester.pumpWidget(const AiLawyerApp());
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const ValueKey('nav-profile')));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Индивидуальный предприниматель'));
    await tester.tap(find.text('Индивидуальный предприниматель'));
    await tester.pumpAndSettle();
    expect(find.text('Индивидуальный предприниматель'), findsOneWidget);

    await tester.ensureVisible(find.text('Быстрый вход по биометрии'));
    await tester.tap(find.text('Быстрый вход по биометрии'));
    await tester.pumpAndSettle();
    expect(find.text('Локальный secure flag включен'), findsOneWidget);

    await tester.ensureVisible(find.text('Настройки'));
    await tester.tap(find.text('Настройки'));
    await tester.pumpAndSettle();
    expect(find.text('Конфиденциальность'), findsOneWidget);

    await tester.ensureVisible(find.text('Сохранить настройки'));
    await tester.tap(find.text('Сохранить настройки'));
    await tester.pumpAndSettle();
    expect(find.text('Настройки сохранены'), findsOneWidget);

    await tester.tap(find.byKey(const ValueKey('nav-profile')));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Помощь и поддержка'));
    await tester.tap(find.text('Помощь и поддержка'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Написать в поддержку'));
    await tester.tap(find.text('Написать в поддержку'));
    await tester.pumpAndSettle();
    expect(find.text('Обращение создано'), findsOneWidget);
  });

  testWidgets('profile save calls API with confirmed user', (tester) async {
    AuthRuntime.userId = 'user-1';
    final api = _FakeProfileApi();
    await setLargeViewport(tester);
    await tester.pumpWidget(MaterialApp(home: ProfileScreen(profileApi: api)));

    final saveProfileButton =
        find.widgetWithText(FilledButton, 'Сохранить профиль').first;
    await tester.scrollUntilVisible(
      saveProfileButton,
      220,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.tap(saveProfileButton);
    await tester.pumpAndSettle();

    expect(api.savedUserId, 'user-1');
    expect(find.textContaining('Профиль сохранен'), findsOneWidget);
  });

  testWidgets('shows pretrial claim builder', (tester) async {
    await setLargeViewport(tester);
    await tester.pumpWidget(const MaterialApp(home: PretrialClaimScreen()));

    expect(find.text('Формирование претензии'), findsOneWidget);
    await tester.ensureVisible(find.text('Открыть проект'));
    expect(find.text('Открыть проект'), findsOneWidget);
  });

  testWidgets('pretrial claim builder generates draft through API',
      (tester) async {
    await setLargeViewport(tester);
    MobileCaseRuntime.activeCaseId = 'case-1';
    final api = _FakeWorkflowApi();
    await tester.pumpWidget(MaterialApp.router(
      routerConfig: GoRouter(
        routes: [
          GoRoute(
            path: '/',
            builder: (_, __) => PretrialClaimScreen(workflowApi: api),
          ),
          GoRoute(
            path: '/workflow/pretrial-claim/draft',
            builder: (_, __) => const ClaimDraftScreen(),
          ),
        ],
      ),
    ));

    await tester.ensureVisible(find.text('Открыть проект'));
    await tester.tap(find.text('Открыть проект'));
    await tester.pumpAndSettle();

    expect(api.generatedCaseId, 'case-1');
    expect(find.text('Проект досудебной претензии'), findsWidgets);
    expect(find.textContaining('API проект претензии'), findsOneWidget);
  });

  testWidgets('case intake voice button and create action work',
      (tester) async {
    await tester.pumpWidget(MaterialApp(
        home: NewCaseScreen(
            recorder: _FakeRecorder(),
            speechRecognizer: _FakeSpeechRecognizer())));

    await tester.tap(find.byIcon(Icons.mic_none));
    await tester.pumpAndSettle();
    expect(find.text('Запись активна'), findsOneWidget);
    expect(find.text('Распознанный текст из микрофона'), findsOneWidget);

    await tester.tap(find.byIcon(Icons.stop));
    await tester.pumpAndSettle();
    expect(find.text('Голос готов к обработке'), findsOneWidget);
    expect(find.text('Текст распознан'), findsOneWidget);
  });

  testWidgets('case intake uploads recorded audio before category route',
      (tester) async {
    final api = _FakeVoiceApi();
    final cases = _FakeCaseApi();
    AuthRuntime.userId = 'user-1';
    await tester.pumpWidget(MaterialApp.router(
      routerConfig: GoRouter(
        routes: [
          GoRoute(
            path: '/',
            builder: (_, __) => NewCaseScreen(
                recorder: _FakeRecorder(),
                speechRecognizer: _FakeSpeechRecognizer(),
                voiceApi: api,
                caseApi: cases),
          ),
          GoRoute(
            path: '/case/category',
            builder: (_, __) => const Scaffold(body: Text('Категория готова')),
          ),
        ],
      ),
    ));

    await tester.tap(find.byIcon(Icons.mic_none));
    await tester.pumpAndSettle();
    await tester.tap(find.byIcon(Icons.stop));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Подтвердить и создать дело'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Подтвердить и создать дело'));
    await tester.pumpAndSettle();

    expect(api.uploadedPath, '/tmp/mobile-test-voice.m4a');
    expect(api.uploadedTranscript, 'Распознанный текст из микрофона');
    expect(cases.createdText, 'Голос отправлен в API');
    expect(find.text('Категория готова'), findsOneWidget);
  });

  testWidgets('case intake keeps recognized text locally without login',
      (tester) async {
    final api = _FakeVoiceApi();
    AuthRuntime.userId = '';
    await tester.pumpWidget(MaterialApp.router(
      routerConfig: GoRouter(
        routes: [
          GoRoute(
            path: '/',
            builder: (_, __) => NewCaseScreen(
                recorder: _FakeRecorder(),
                speechRecognizer: _FakeSpeechRecognizer(),
                voiceApi: api),
          ),
          GoRoute(
            path: '/case/category',
            builder: (_, __) => const Scaffold(body: Text('Категория готова')),
          ),
        ],
      ),
    ));

    await tester.tap(find.byIcon(Icons.mic_none));
    await tester.pumpAndSettle();
    await tester.tap(find.byIcon(Icons.stop));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Подтвердить и создать дело'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Подтвердить и создать дело'));
    await tester.pumpAndSettle();

    expect(api.uploadedPath, isNull);
    expect(find.text('Категория готова'), findsOneWidget);
  });

  testWidgets('chat sends messages through case API when case exists',
      (tester) async {
    await setLargeViewport(tester);
    final cases = _FakeCaseApi();
    MobileCaseRuntime.activeCaseId = 'case-1';
    await tester.pumpWidget(MaterialApp(home: CaseChatScreen(caseApi: cases)));

    await tester.enterText(find.byType(TextField), 'Какие документы нужны?');
    await tester.ensureVisible(find.byTooltip('Отправить'));
    await tester.tap(find.byTooltip('Отправить'));
    await tester.pumpAndSettle();

    expect(cases.sentText, 'Какие документы нужны?');
    expect(find.text('Ответ из API'), findsOneWidget);
  });

  testWidgets('chat send button adds user and assistant messages',
      (tester) async {
    await setLargeViewport(tester);
    await tester.pumpWidget(const MaterialApp(home: CaseChatScreen()));

    await tester.enterText(find.byType(TextField), 'Какие документы нужны?');
    await tester.ensureVisible(find.byTooltip('Отправить'));
    await tester.tap(find.byTooltip('Отправить'));
    await tester.pumpAndSettle();

    expect(find.text('Какие документы нужны?'), findsOneWidget);
    await tester.drag(find.byType(ListView), const Offset(0, -300));
    await tester.pumpAndSettle();
    expect(find.textContaining('Для ответа потребуется'), findsOneWidget);
  });

  testWidgets('document upload scan and OCR confirmation buttons work',
      (tester) async {
    await setLargeViewport(tester);
    tester.view.physicalSize = const Size(941, 3000);
    MobileCaseRuntime.activeCaseId = '11111111-1111-1111-1111-111111111111';
    final docs = _FakeDocumentApi();
    await tester.pumpWidget(MaterialApp.router(
      routerConfig: GoRouter(
        routes: [
          GoRoute(
            path: '/',
            builder: (_, __) => DocumentsScreen(
              filePicker: _FakeDocumentPicker(),
              documentApi: docs,
            ),
          ),
          GoRoute(
            path: '/documents/analysis',
            builder: (_, __) => const DocumentAnalysisScreen(),
          ),
          GoRoute(
            path: '/workflow/pretrial-claim',
            builder: (_, __) => const PretrialClaimScreen(),
          ),
        ],
      ),
    ));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Загрузить файл'), warnIfMissed: false);
    await tester.pumpAndSettle();
    expect(find.text('Файл добавлен'), findsOneWidget);
    expect(docs.uploadedFileName, 'claim.pdf');

    await tester.tap(find.text('Сканировать документ'), warnIfMissed: false);
    await tester.pumpAndSettle();
    expect(find.text('Скан готов'), findsOneWidget);

    final confirmFieldsButton =
        find.widgetWithText(FilledButton, 'Подтвердить поля');
    await tester.tap(confirmFieldsButton, warnIfMissed: false);
    await tester.pumpAndSettle();
    expect(find.text('Поля подтверждены'), findsOneWidget);
    expect(docs.ocrDocumentId, 'document-1');

    await tester.tap(find.text('Договор и переписка'), warnIfMissed: false);
    await tester.pumpAndSettle();
    expect(docs.evidenceCaseId, MobileCaseRuntime.activeCaseId);

    await tester.tap(find.text('Анализировать документы'), warnIfMissed: false);
    await tester.pumpAndSettle();
    expect(find.text('Анализ документов'), findsWidgets);
    await tester.tap(find.text('Подтвердить анализ'), warnIfMissed: false);
    await tester.pumpAndSettle();
    expect(find.text('Анализ завершен'), findsOneWidget);
  });

  testWidgets('pretrial claim draft and send flow works', (tester) async {
    await setLargeViewport(tester);
    await tester.pumpWidget(const MaterialApp(home: ClaimDraftScreen()));
    await tester.pumpAndSettle();

    expect(find.text('Проект досудебной претензии'), findsWidgets);
    await tester.ensureVisible(find.text('Проверено пользователем'));
    await tester.tap(find.text('Проверено пользователем'));
    await tester.pumpAndSettle();
    await tester
        .ensureVisible(find.widgetWithText(FilledButton, 'Перейти к отправке'));
    expect(find.widgetWithText(FilledButton, 'Перейти к отправке'),
        findsOneWidget);

    await tester.pumpWidget(const MaterialApp(home: ClaimSendScreen()));
    await tester.pumpAndSettle();
    expect(find.text('Выберите способ отправки'), findsOneWidget);
    await tester.ensureVisible(find.text('Отправить'));
    await tester.tap(find.text('Отправить'));
    await tester.pumpAndSettle();
    expect(find.text('Отправка зафиксирована'), findsOneWidget);
  });

  testWidgets('shows subscription budget screen', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: SubscriptionScreen()));

    expect(find.text('Подписка'), findsWidgets);
    await tester.scrollUntilVisible(
        find.text('AI расходы считаются без персональных данных.'), 220);
    expect(find.text('AI расходы считаются без персональных данных.'),
        findsOneWidget);
  });

  testWidgets('subscription loads budget from API', (tester) async {
    AuthRuntime.userId = 'user-1';
    await tester.pumpWidget(
        MaterialApp(home: SubscriptionScreen(billingApi: _FakeBillingApi())));
    await tester.pumpAndSettle();

    await tester.scrollUntilVisible(
        find.text('Текущий план: RC Internal'), 220);
    expect(find.text('Текущий план: RC Internal'), findsOneWidget);
    expect(find.textContaining('AI расходы: 72%'), findsOneWidget);
  });

  testWidgets('subscription payment button shows blocker dialog',
      (tester) async {
    await tester.pumpWidget(const MaterialApp(home: SubscriptionScreen()));

    await tester.scrollUntilVisible(
        find.text('Управление оплатой недоступно в stub mode'), 220);
    await tester.tap(find.text('Управление оплатой недоступно в stub mode'));
    await tester.pumpAndSettle();

    expect(find.text('Оплата недоступна'), findsOneWidget);
    expect(find.textContaining('Payment provider'), findsOneWidget);
  });

  testWidgets('settings exports and deletes account through API',
      (tester) async {
    await setLargeViewport(tester);
    AuthRuntime.userId = 'user-1';
    final api = _FakeAccountApi();
    await tester.pumpWidget(MaterialApp(home: SettingsScreen(accountApi: api)));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Экспортировать данные'));
    await tester.pumpAndSettle();
    expect(api.exportedUserId, 'user-1');
    expect(find.textContaining('Экспорт готов: 2 профилей, 1 сессий'),
        findsOneWidget);

    await tester.ensureVisible(find.text('Удалить аккаунт'));
    await tester.tap(find.text('Удалить аккаунт'));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(FilledButton, 'Удалить'));
    await tester.pumpAndSettle();

    expect(api.deletedUserId, 'user-1');
    expect(AuthRuntime.userId, isEmpty);
    expect(find.text('Аккаунт удален, сессии отозваны'), findsOneWidget);
  });
}

class _FakeRecorder implements VoiceRecorderPort {
  @override
  Future<void> dispose() async {}

  @override
  Future<bool> hasPermission() async => true;

  @override
  Future<void> start(String path) async {}

  @override
  Future<String?> stop() async => '/tmp/mobile-test-voice.m4a';
}

class _FakeSpeechRecognizer implements SpeechRecognizerPort {
  var lastWords = 'Распознанный текст из микрофона';

  @override
  Future<void> dispose() async {}

  @override
  Future<bool> start({
    required String localeId,
    required SpeechResultCallback onText,
    required SpeechStatusCallback onStatus,
  }) async {
    onStatus('Распознаю речь...');
    onText(lastWords, false);
    return true;
  }

  @override
  Future<String> stop() async => lastWords;
}

class _FakeVoiceApi implements VoiceTranscriptPort {
  String? uploadedPath;
  String? uploadedTranscript;

  @override
  Future<VoiceTranscriptJob> uploadAudio({
    required String userId,
    required String path,
    required String transcript,
  }) async {
    expect(userId, isNotEmpty);
    uploadedPath = path;
    uploadedTranscript = transcript;
    return const VoiceTranscriptJob(
      id: '12345678-1234-1234-1234-123456789012',
      transcript: 'Голос отправлен в API',
    );
  }
}

class _FakeCaseApi implements CaseApiPort {
  String? createdText;
  String? sentText;

  @override
  Future<CaseListItem> createCase({
    required String ownerUserId,
    required String problemText,
  }) async {
    createdText = problemText;
    return const CaseListItem('Дело из API', 'Гражданское право · Дело №case-1',
        '● В работе', Icons.balance_outlined, 'case-1');
  }

  @override
  Future<List<CaseListItem>> listCases(String ownerUserId) async => [
        const CaseListItem('Дело из API', 'Гражданское право · Дело №case-1',
            '● В работе', Icons.balance_outlined, 'case-1'),
      ];

  @override
  Future<List<ChatMessageItem>> sendMessage({
    required String caseId,
    required String text,
  }) async {
    sentText = text;
    return [
      ChatMessageItem(text: text, assistant: false),
      const ChatMessageItem(text: 'Ответ из API', assistant: true),
    ];
  }
}

class _FakeAuthApi implements AuthApiPort {
  var registerCalled = false;
  var verifyCalled = false;

  @override
  Future<AuthOtpResult> register({
    required String channel,
    String? phone,
    String? email,
    String? password,
  }) async {
    registerCalled = true;
    return const AuthOtpResult(otpId: 'otp-1', testCode: '111111');
  }

  @override
  Future<AuthSessionResult> verifyOtp({
    required String otpId,
    required String code,
  }) async {
    verifyCalled = true;
    return const AuthSessionResult(userId: 'user-1');
  }
}

class _FakeProfileApi implements ProfileApiPort {
  String? savedUserId;

  @override
  Future<String> createProfile({
    required String userId,
    required String type,
    required String displayName,
    String? iinBin,
    String? address,
  }) async {
    savedUserId = userId;
    return 'profile-12345678';
  }
}

class _FakeDocumentPicker implements DocumentFilePickerPort {
  @override
  Future<PickedDocumentFile?> pick() async => const PickedDocumentFile(
        name: 'claim.pdf',
        path: '/tmp/claim.pdf',
        sizeBytes: 128,
        mimeType: 'application/pdf',
        sha256: 'abc123',
      );
}

class _FakeDocumentApi implements DocumentApiPort {
  String? uploadedFileName;
  String? ocrDocumentId;
  String? evidenceCaseId;

  @override
  Future<UploadedDocumentResult> uploadMetadata({
    required String caseId,
    required PickedDocumentFile file,
  }) async {
    uploadedFileName = file.name;
    return const UploadedDocumentResult(
        id: 'document-1', fileName: 'claim.pdf');
  }

  @override
  Future<void> confirmOcr(String documentId, Map<String, String> fields) async {
    ocrDocumentId = documentId;
  }

  @override
  Future<String> createEvidence({
    required String caseId,
    required String title,
    required List<String> documentIds,
  }) async {
    evidenceCaseId = caseId;
    return 'evidence-12345678';
  }
}

class _FakeLegalApi implements LegalApiPort {
  String? answeredQuery;
  String? validatedFragmentId;

  @override
  Future<LegalAnswerResult> answer(String query) async {
    answeredQuery = query;
    return const LegalAnswerResult(
      message: 'Норма найдена через API',
      fragment: LegalAnswerFragment(
        id: 'fragment-1',
        sourceUrl: 'https://zan.gov.kz/test',
        text: 'Тестовый официальный фрагмент',
        officialId: 'KZ-TEST',
        article: 'ст. 1',
      ),
    );
  }

  @override
  Future<String> validateCitation(LegalAnswerFragment fragment) async {
    validatedFragmentId = fragment.id;
    return 'Цитата проверена API';
  }
}

class _FakeWorkflowApi implements WorkflowApiPort {
  String? generatedCaseId;

  @override
  Future<GeneratedClaimDraft> generateClaim({
    required String caseId,
    required String claimantName,
    required String respondentName,
    required String claimAmount,
    required String claimReason,
  }) async {
    generatedCaseId = caseId;
    return const GeneratedClaimDraft(
      id: 'draft-12345678',
      body: 'API проект претензии: требование подтверждено пользователем.',
    );
  }
}

class _FakeBillingApi implements BillingApiPort {
  @override
  Future<BillingStatus> current(String userId) async => const BillingStatus(
        plan: 'RC Internal',
        percent: 72,
        ttsDisabled: false,
      );
}

class _FakeAccountApi implements AccountApiPort {
  String? exportedUserId;
  String? deletedUserId;

  @override
  Future<AccountExportResult> exportAccount(String userId) async {
    exportedUserId = userId;
    return const AccountExportResult(profileCount: 2, sessionCount: 1);
  }

  @override
  Future<void> deleteAccount(String userId) async {
    deletedUserId = userId;
  }
}

Future<void> setLargeViewport(WidgetTester tester) async {
  tester.view.physicalSize = const Size(941, 1672);
  tester.view.devicePixelRatio = 1;
  addTearDown(() {
    tester.view.resetPhysicalSize();
    tester.view.resetDevicePixelRatio();
  });
}
