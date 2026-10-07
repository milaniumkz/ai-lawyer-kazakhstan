import 'package:ai_lawyer_kz/main.dart';
import 'package:ai_lawyer_kz/src/features/auth/auth_screens.dart';
import 'package:ai_lawyer_kz/src/features/cases/case_screens.dart';
import 'package:ai_lawyer_kz/src/features/documents/document_screens.dart';
import 'package:ai_lawyer_kz/src/features/home/home_screen.dart';
import 'package:ai_lawyer_kz/src/features/legal/legal_screens.dart';
import 'package:ai_lawyer_kz/src/features/subscription/subscription_screen.dart';
import 'package:ai_lawyer_kz/src/features/workflows/workflow_screens.dart';
import 'package:ai_lawyer_kz/src/api/api_contract.dart';
import 'package:ai_lawyer_kz/src/widgets/app_bottom_nav.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

void main() {
  setUp(() {
    AuthRuntime.otpId = '';
    AuthRuntime.otpCodeHint = null;
    AuthRuntime.userId = '';
    AuthRuntime.displayName = 'Тестовый пользователь';
    AuthRuntime.profileComplete = false;
    MobileCaseRuntime.activeCaseId = '';
    MobileCaseRuntime.activeCaseTitle = '';
    MobileCaseRuntime.activeCaseSubtitle = '';
    MobileCaseRuntime.activeCaseStatus = '';
    MobileCaseRuntime.confirmedText = '';
    MobileCaseRuntime.draftClassification = null;
    MobileCaseRuntime.confirmedClassificationId = '';
    MobileCaseRuntime.preferVoiceInput = false;
    DocumentRuntime.documents.clear();
    DocumentRuntime.confirmedIds.clear();
    MobileCaseRuntime.draftCaseId = 'draft-initial';
    MobileCaseRuntime.createdDraftCaseId = '';
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
    await tester.pumpWidget(const AiLawyerApp(initialLocation: '/'));

    expect(find.byKey(const ValueKey('home-voice')), findsOneWidget);
    expect(find.text('Ввести текст'), findsOneWidget);
  });

  testWidgets('home text keeps input and conversation on home', (tester) async {
    await setLargeViewport(tester);
    await tester.pumpWidget(const AiLawyerApp(initialLocation: '/'));
    await tester.tap(find.byKey(const ValueKey('home-text')));
    await tester.pumpAndSettle();
    expect(find.byType(NewCaseScreen), findsOneWidget);
    expect(tester.widget<NewCaseScreen>(find.byType(NewCaseScreen)).homeMode,
        isTrue);
    await tester.enterText(
        find.byType(TextField), 'Сохранённое описание проблемы');
    expect(MobileCaseRuntime.confirmedText, 'Сохранённое описание проблемы');
    expect(find.byType(AppBottomNav), findsOneWidget);
  });

  testWidgets('profile navigation opens profile', (tester) async {
    await tester.pumpWidget(const AiLawyerApp(initialLocation: '/'));
    await tester.tap(find.byKey(const ValueKey('nav-profile')));
    await tester.pumpAndSettle();
    expect(find.text('Профиль пользователя'), findsWidgets);
  });

  testWidgets('onboarding buttons work', (tester) async {
    await tester.pumpWidget(const AiLawyerApp(initialLocation: '/onboarding'));
    await tester.pumpAndSettle();

    expect(find.text('AI Юрист Казахстан'), findsOneWidget);
    await tester.tap(find.text('Начать работу'));
    await tester.pumpAndSettle();
    expect(find.text('Войти по номеру телефона'), findsWidgets);

    await tester.pumpWidget(const AiLawyerApp(initialLocation: '/onboarding'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Войти в аккаунт'));
    await tester.pumpAndSettle();
    expect(find.text('Войти по номеру телефона'), findsWidgets);
  });

  testWidgets('phone otp requires profile before home on first login',
      (tester) async {
    await setLargeViewport(tester);
    final api = _FakeAuthApi();
    final profileApi = _FakeProfileApi();
    await tester.pumpWidget(MaterialApp.router(
      routerConfig: GoRouter(
        initialLocation: '/login',
        routes: [
          GoRoute(
              path: '/login', builder: (_, __) => LoginScreen(authApi: api)),
          GoRoute(
              path: '/register',
              builder: (_, __) => RegisterScreen(profileApi: profileApi)),
          GoRoute(path: '/otp', builder: (_, __) => OtpScreen(authApi: api)),
          GoRoute(path: '/', builder: (_, __) => const HomeScreen()),
        ],
      ),
    ));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Войти по номеру телефона'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Получить SMS-код'));
    await tester.pumpAndSettle();
    expect(api.registerCalled, isTrue);
    expect(find.text('RC local SMS: 111111'), findsOneWidget);

    await tester.tap(find.text('Подтвердить'));
    await tester.pumpAndSettle();
    expect(api.verifyCalled, isTrue);
    expect(find.text('Регистрация пользователя'), findsWidgets);

    await tester.enterText(find.widgetWithText(TextField, 'Фамилия'), 'Иванов');
    await tester.enterText(find.widgetWithText(TextField, 'Имя'), 'Иван');
    await tester.enterText(find.widgetWithText(TextField, 'Город'), 'Алматы');
    await tester.tap(find.text('Завершить регистрацию'));
    await tester.pumpAndSettle();
    expect(profileApi.savedUserId, 'user-1');
    expect(find.byKey(const ValueKey('home-voice')), findsOneWidget);
  });

  testWidgets('auth and registration screens do not show bottom navigation',
      (tester) async {
    for (final route in ['/login', '/otp', '/register']) {
      await tester.pumpWidget(MaterialApp.router(
        routerConfig: GoRouter(
          initialLocation: route,
          routes: [
            GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
            GoRoute(
                path: '/register', builder: (_, __) => const RegisterScreen()),
            GoRoute(path: '/otp', builder: (_, __) => const OtpScreen()),
          ],
        ),
      ));
      await tester.pumpAndSettle();
      expect(find.byType(AppBottomNav), findsNothing);
    }
  });

  testWidgets('all release routes open through app router', (tester) async {
    await setLargeViewport(tester);
    const routes = [
      ['/', 'Ввести текст'],
      ['/onboarding', 'AI Юрист Казахстан'],
      ['/login', 'Войти по номеру телефона'],
      ['/register', 'Регистрация пользователя'],
      ['/otp', 'Подтверждение SMS'],
      ['/biometric', 'Быстрый вход по биометрии'],
      ['/profile', 'Профиль пользователя'],
      ['/settings', 'Настройки'],
      ['/help', 'Помощь и поддержка'],
      ['/cases', 'Мои дела'],
      ['/case/details', 'Карточка дела'],
      ['/case/new', 'Опишите проблему'],
      ['/case/category', 'Категория определена'],
      ['/case/chat', 'Чат по делу'],
      ['/documents', 'Документы и доказательства'],
      ['/documents/analysis', 'Анализ документов'],
      ['/deadlines', 'Календарь и сроки'],
      ['/legal', 'AI поиск нормы'],
      ['/workflow/pretrial-claim', 'Формирование претензии'],
      ['/workflow/pretrial-claim/draft', 'Предпросмотр документа'],
      ['/workflow/pretrial-claim/send', 'Выберите способ отправки'],
      ['/subscription', 'Подписка'],
    ];

    for (final route in routes) {
      await tester.pumpWidget(const SizedBox.shrink());
      await tester.pumpWidget(AiLawyerApp(initialLocation: route[0]));
      await tester.pumpAndSettle();
      expect(find.text(route[1]), findsWidgets, reason: route[0]);
      expect(tester.takeException(), isNull, reason: route[0]);
    }
  });

  testWidgets('shows case intake screen', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: NewCaseScreen()));

    expect(find.text('Подтвердить текст'), findsOneWidget);
  });

  testWidgets('home intake validates description without leaving home',
      (tester) async {
    await setLargeViewport(tester);
    await tester.pumpWidget(const AiLawyerApp(initialLocation: '/'));
    await tester.tap(find.byKey(const ValueKey('home-text')));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Подтвердить текст'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Подтвердить текст'));
    await tester.pumpAndSettle();
    expect(find.textContaining('минимум 12'), findsOneWidget);
    expect(find.byType(NewCaseScreen), findsOneWidget);
  });

  testWidgets('bottom navigation opens cases documents deadlines and profile',
      (tester) async {
    await setLargeViewport(tester);
    await tester.pumpWidget(const AiLawyerApp(initialLocation: '/'));
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const ValueKey('nav-cases')));
    await tester.pumpAndSettle();
    expect(find.text('Мои дела'), findsWidgets);

    await tester.tap(find.byKey(const ValueKey('nav-documents')));
    await tester.pumpAndSettle();
    expect(find.text('Документы и доказательства'), findsWidgets);

    await tester.tap(find.byKey(const ValueKey('nav-profile')));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Календарь и сроки'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Календарь и сроки'));
    await tester.pumpAndSettle();
    expect(find.text('Календарь и сроки'), findsOneWidget);
    expect(find.text('Календарь пуст'), findsOneWidget);
    expect(find.text('Нет рассчитанных сроков'), findsOneWidget);
    expect(find.textContaining('15 мая 2024'), findsNothing);
    expect(find.textContaining('Подать иск'), findsNothing);

    await tester.tap(find.byKey(const ValueKey('nav-profile')));
    await tester.pumpAndSettle();
    expect(find.text('Профиль пользователя'), findsWidgets);
  });

  testWidgets('cases list filters search and opens case details',
      (tester) async {
    await setLargeViewport(tester);
    AuthRuntime.userId = 'user-1';
    final api = _FakeCaseApi();
    await tester.pumpWidget(MaterialApp.router(
      routerConfig: GoRouter(
        initialLocation: '/cases',
        routes: [
          GoRoute(
              path: '/cases',
              builder: (_, __) => CasesListScreen(caseApi: api)),
          GoRoute(
              path: '/case/details',
              builder: (_, __) => const CaseDetailsScreen()),
        ],
      ),
    ));
    await tester.pumpAndSettle();

    await tester.tap(find.text('В работе'));
    await tester.pumpAndSettle();
    expect(find.text('Дело из API'), findsOneWidget);

    await tester.tap(find.byTooltip('Поиск дела'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField), 'API');
    await tester.pumpAndSettle();
    expect(find.text('Дело из API'), findsWidgets);
    await tester.tap(find.byTooltip('Назад'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Дело из API').first);
    await tester.pumpAndSettle();
    expect(find.text('Карточка дела'), findsOneWidget);
    expect(find.text('Дело из API'), findsOneWidget);
    expect(find.text('Сумма не указана в данных дела'), findsOneWidget);
    expect(find.text('Документы загружаются на экране документов'),
        findsOneWidget);
    expect(find.text('Подтвержденные даты не указаны'), findsOneWidget);
    expect(find.textContaining('1 250 000'), findsNothing);
    expect(find.textContaining('18 апр'), findsNothing);
    expect(find.textContaining('Всего: 12'), findsNothing);
    expect(find.text('Продолжить работу'), findsOneWidget);
  });

  testWidgets('documents expose real empty state and upload action',
      (tester) async {
    await tester.pumpWidget(const MaterialApp(home: DocumentsScreen()));
    expect(find.text('Документы и доказательства'), findsOneWidget);
    expect(find.text('Добавить документ'), findsOneWidget);
    expect(find.textContaining('OCR завершён'), findsNothing);
  });

  testWidgets('shows legal citation guardrails screen', (tester) async {
    await setLargeViewport(tester);
    final api = _FakeLegalApi();
    await tester
        .pumpWidget(MaterialApp(home: LegalSourcesScreen(legalApi: api)));

    expect(find.text('AI поиск нормы'), findsOneWidget);
    expect(find.textContaining('RAG · этап'), findsOneWidget);
    expect(find.textContaining('Нет подтвержденной нормы без источника'),
        findsOneWidget);
    await tester.scrollUntilVisible(
      find.text('Citation Validator'),
      220,
      scrollable: find.byType(Scrollable).first,
    );
    expect(find.text('Citation Validator'), findsOneWidget);

    await tester.tap(find.byTooltip('Найти норму'));
    await tester.pumpAndSettle();
    expect(find.text('Норма найдена'), findsOneWidget);
    expect(find.textContaining('Источник подтвержден'), findsOneWidget);
    expect(api.answeredQuery, 'взыскание долга по расписке');

    await tester.scrollUntilVisible(
      find.text('Citation Validator'),
      220,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.tap(find.text('Citation Validator'));
    await tester.pumpAndSettle();
    expect(find.text('Цитата проверена API'), findsWidgets);
    expect(api.validatedFragmentId, 'fragment-1');
  });

  testWidgets('biometric does not fake successful enrollment', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: BiometricScreen()));
    expect(find.text('Недоступно'), findsOneWidget);
    expect(tester.widget<FilledButton>(find.byType(FilledButton)).onPressed,
        isNull);
    expect(find.textContaining('локально'), findsNothing);
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
    expect(find.textContaining('Профиль сохранен'), findsWidgets);
  });

  testWidgets('claim generation requires a selected case', (tester) async {
    await setLargeViewport(tester);
    await tester.pumpWidget(const MaterialApp(home: PretrialClaimScreen()));
    await tester.ensureVisible(find.text('Открыть проект'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Открыть проект'));
    await tester.pumpAndSettle();
    expect(find.textContaining('дело'), findsWidgets);
    expect(WorkflowRuntime.generatedBody, isEmpty);
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

    await tester.enterText(
        find.widgetWithText(TextField, 'Заявитель'), 'Дмитрий Штрахов');
    await tester.enterText(
        find.widgetWithText(TextField, 'Ответчик'), 'ТОО Контрагент');
    await tester.enterText(
        find.widgetWithText(TextField, 'Сумма требования, ₸'), '1250000');
    await tester.enterText(
        find.widgetWithText(TextField, 'Основание требования'),
        'Задолженность по договору');
    await tester.pumpAndSettle();

    await tester.ensureVisible(find.text('Открыть проект'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Открыть проект'));
    await tester.pumpAndSettle();

    expect(api.generatedCaseId, 'case-1');
    expect(find.text('Предпросмотр документа'), findsWidgets);
    expect(find.textContaining('API проект претензии'), findsOneWidget);
  });

  testWidgets('case intake voice button and create action work',
      (tester) async {
    await tester.pumpWidget(MaterialApp(
        home: NewCaseScreen(
            recorder: _FakeRecorder(),
            speechRecognizer: _FakeSpeechRecognizer())));

    await tester.ensureVisible(find.byIcon(Icons.mic_none));
    await tester.pumpAndSettle();
    await tester.tap(find.byIcon(Icons.mic_none));
    await tester.pumpAndSettle();
    expect(find.text('Завершить запись'), findsOneWidget);
    expect(find.text('Распознанный текст из микрофона'), findsOneWidget);

    await tester.ensureVisible(find.byIcon(Icons.stop));
    await tester.pumpAndSettle();
    await tester.tap(find.byIcon(Icons.stop));
    await tester.pumpAndSettle();
    expect(find.text('Начать запись'), findsOneWidget);
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

    await tester.ensureVisible(find.byIcon(Icons.mic_none));
    await tester.pumpAndSettle();
    await tester.tap(find.byIcon(Icons.mic_none));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.byIcon(Icons.stop));
    await tester.pumpAndSettle();
    await tester.tap(find.byIcon(Icons.stop));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Подтвердить текст'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Подтвердить текст'));
    await tester.pumpAndSettle();

    expect(api.uploadedPath, '/tmp/mobile-test-voice.m4a');
    expect(api.uploadedTranscript, 'Распознанный текст из микрофона');
    expect(cases.createdText, isNull);
    expect(MobileCaseRuntime.confirmedText, 'Голос отправлен в API');
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

    await tester.ensureVisible(find.byIcon(Icons.mic_none));
    await tester.pumpAndSettle();
    await tester.tap(find.byIcon(Icons.mic_none));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.byIcon(Icons.stop));
    await tester.pumpAndSettle();
    await tester.tap(find.byIcon(Icons.stop));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Подтвердить текст'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Подтвердить текст'));
    await tester.pumpAndSettle();

    expect(api.uploadedPath, isNull);
    expect(find.text('Категория готова'), findsOneWidget);
  });

  testWidgets(
      'case intake preserves text and offers retry when audio upload fails',
      (tester) async {
    AuthRuntime.userId = 'user-1';
    MobileCaseRuntime.confirmedText = '';
    await tester.pumpWidget(MaterialApp.router(
      routerConfig: GoRouter(
        routes: [
          GoRoute(
            path: '/',
            builder: (_, __) => NewCaseScreen(
                recorder: _FakeRecorder(),
                speechRecognizer: _FakeSpeechRecognizer(),
                voiceApi: _FailingVoiceApi()),
          ),
          GoRoute(
            path: '/case/category',
            builder: (_, __) => const Scaffold(body: Text('Категория готова')),
          ),
        ],
      ),
    ));

    await tester.ensureVisible(find.byIcon(Icons.mic_none));
    await tester.pumpAndSettle();
    await tester.tap(find.byIcon(Icons.mic_none));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.byIcon(Icons.stop));
    await tester.pumpAndSettle();
    await tester.tap(find.byIcon(Icons.stop));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Подтвердить текст'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Подтвердить текст'));
    await tester.pumpAndSettle();

    expect(MobileCaseRuntime.confirmedText, 'Распознанный текст из микрофона');
    expect(find.text('Категория готова'), findsNothing);
    expect(find.textContaining('Не удалось отправить аудио'), findsOneWidget);
  });

  testWidgets('category screen classifies confirms and creates case',
      (tester) async {
    await setLargeViewport(tester);
    AuthRuntime.userId = 'user-1';
    MobileCaseRuntime.confirmedText = 'Хочу подать на алименты на ребёнка';
    final cases = _FakeCaseApi();
    await tester.pumpWidget(MaterialApp.router(
      routerConfig: GoRouter(
        routes: [
          GoRoute(
            path: '/',
            builder: (_, __) => CategoryScreen(caseApi: cases),
          ),
          GoRoute(
            path: '/case/details',
            builder: (_, __) => const Scaffold(body: Text('Карточка дела')),
          ),
        ],
      ),
    ));
    await tester.pumpAndSettle();

    expect(cases.classifiedText, 'Хочу подать на алименты на ребёнка');
    expect(find.text('Категория определена'), findsWidgets);
    expect(find.text('Брачно-семейные отношения'), findsOneWidget);
    expect(find.text('Взыскание алиментов на ребёнка'), findsOneWidget);

    await tester.tap(find.text('Продолжить'));
    await tester.pumpAndSettle();

    expect(cases.confirmedClassificationId, 'classification-1');
    expect(cases.createdText, contains('family.alimony.child'));
    expect(MobileCaseRuntime.currentDraftCreated, isTrue);
    expect(find.text('Карточка дела'), findsOneWidget);
  });

  testWidgets('category blocks case creation when AI needs missing facts',
      (tester) async {
    await setLargeViewport(tester);
    AuthRuntime.userId = 'user-1';
    MobileCaseRuntime.confirmedText = 'Заказчик не оплатил договор';
    final cases = _FakeCaseApi(missingFacts: const ['contract_date']);
    await tester.pumpWidget(MaterialApp.router(
      routerConfig: GoRouter(
        routes: [
          GoRoute(
            path: '/',
            builder: (_, __) => CategoryScreen(caseApi: cases),
          ),
          GoRoute(
            path: '/case/details',
            builder: (_, __) => const Scaffold(body: Text('Карточка дела')),
          ),
        ],
      ),
    ));
    await tester.pumpAndSettle();

    expect(find.byType(TextField), findsOneWidget);
    await tester.tap(find.widgetWithText(FilledButton, 'Ответьте AI'));
    await tester.pumpAndSettle();

    expect(cases.createdText, isNull);
    expect(find.text('Сначала ответьте на вопросы AI'), findsOneWidget);
  });

  testWidgets('chat sends messages through case API when case exists',
      (tester) async {
    await setLargeViewport(tester);
    final cases = _FakeCaseApi();
    MobileCaseRuntime.activeCaseId = 'case-1';
    await tester.pumpWidget(MaterialApp(home: CaseChatScreen(caseApi: cases)));

    await tester.enterText(find.byType(TextField), 'Какие документы нужны?');
    await tester.ensureVisible(find.byTooltip('Отправить'));
    await tester.pumpAndSettle();
    await tester.tap(find.byTooltip('Отправить'));
    await tester.pumpAndSettle();

    expect(cases.sentText, 'Какие документы нужны?');
    expect(find.text('Ответ из API'), findsOneWidget);
  });

  testWidgets('chat without a case preserves input and does not fake an answer',
      (tester) async {
    await setLargeViewport(tester);
    await tester.pumpWidget(const MaterialApp(home: CaseChatScreen()));

    await tester.enterText(find.byType(TextField), 'Какие документы нужны?');
    await tester.ensureVisible(find.byTooltip('Отправить'));
    await tester.pumpAndSettle();
    await tester.tap(find.byTooltip('Отправить'));
    await tester.pumpAndSettle();

    expect(find.text('Какие документы нужны?'), findsOneWidget);
    await tester.drag(find.byType(ListView), const Offset(0, -300));
    await tester.pumpAndSettle();
    expect(tester.widget<TextField>(find.byType(TextField)).controller!.text,
        'Какие документы нужны?');
    expect(find.textContaining('Сначала создайте'), findsOneWidget);
  });

  testWidgets('document upload and manual field confirmation reach API',
      (tester) async {
    await setLargeViewport(tester);
    MobileCaseRuntime.activeCaseId = 'case-1';
    AuthRuntime.userId = 'user-1';
    final api = _FakeDocumentApi();
    await tester.pumpWidget(MaterialApp(
        home: DocumentsScreen(
            filePicker: _FakeDocumentPicker(),
            documentApi: api,
            addMode: true)));
    await tester.tap(find.text('Загрузить файл'));
    await tester.pumpAndSettle();
    expect(api.uploadedFileName, 'claim.pdf');
    expect(find.textContaining('Файл сохранён'), findsOneWidget);
    await tester.ensureVisible(find.text('Подтвердить поля'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Подтвердить поля'));
    await tester.pumpAndSettle();
    expect(api.ocrDocumentId, 'document-1');
    expect(DocumentRuntime.confirmedIds, contains('document-1'));
  });

  testWidgets('empty draft cannot be approved or submitted', (tester) async {
    await setLargeViewport(tester);
    await tester.pumpWidget(const MaterialApp(home: ClaimDraftScreen()));
    await tester.pumpAndSettle();
    expect(find.text('Предпросмотр документа'), findsOneWidget);
    expect(tester.widget<TextField>(find.byType(TextField)).controller!.text,
        isEmpty);
    expect(
        tester
            .widget<FilledButton>(
                find.widgetWithText(FilledButton, 'Перейти к отправке'))
            .onPressed,
        isNull);
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

  testWidgets('subscription payment button calls API blocker', (tester) async {
    AuthRuntime.userId = 'user-1';
    await tester.pumpWidget(
        MaterialApp(home: SubscriptionScreen(billingApi: _FakeBillingApi())));
    await tester.pumpAndSettle();

    await tester.scrollUntilVisible(find.text('Профессиональный'), 220);
    await tester.tap(find.text('Профессиональный'));
    await tester.pumpAndSettle();

    expect(find.textContaining('PAYMENT_PROVIDER_REQUIRED'), findsOneWidget);
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
    await tester.pumpAndSettle();
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

class _FailingVoiceApi implements VoiceTranscriptPort {
  @override
  Future<VoiceTranscriptJob> uploadAudio({
    required String userId,
    required String path,
    required String transcript,
  }) async {
    throw StateError('network down');
  }
}

class _FakeCaseApi implements CaseApiPort {
  _FakeCaseApi({this.missingFacts = const []});

  final List<String> missingFacts;
  String? createdText;
  String? sentText;
  String? classifiedText;
  String? confirmedClassificationId;
  String? overriddenCode;

  @override
  Future<CaseClassificationResult> classifyDispute({
    required String ownerUserId,
    required String text,
  }) async {
    classifiedText = text;
    return CaseClassificationResult(
      id: 'classification-1',
      categoryLabel: 'Брачно-семейные отношения',
      subcategoryLabel: 'Взыскание алиментов на ребёнка',
      subcategoryCode: 'family.alimony.child',
      confidence: 0.92,
      missingFacts: missingFacts,
      alternatives: const ['family.divorce'],
      riskLevel: 'medium',
      requiredHumanReview: false,
    );
  }

  @override
  Future<CaseClassificationResult> confirmClassification({
    required String ownerUserId,
    required String classificationId,
  }) async {
    confirmedClassificationId = classificationId;
    return classifyDispute(
      ownerUserId: ownerUserId,
      text: MobileCaseRuntime.confirmedText,
    );
  }

  @override
  Future<CaseClassificationResult> overrideClassification({
    required String ownerUserId,
    required String classificationId,
    required String subcategoryCode,
  }) async {
    overriddenCode = subcategoryCode;
    return CaseClassificationResult(
      id: classificationId,
      categoryLabel: 'Семейные споры',
      subcategoryLabel: subcategoryCode,
      subcategoryCode: subcategoryCode,
      confidence: 1,
      missingFacts: const [],
      alternatives: const [],
      riskLevel: 'medium',
      requiredHumanReview: false,
    );
  }

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
    return const AuthSessionResult(
      userId: 'user-1',
      isNewUser: true,
      profileRequired: true,
    );
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

  @override
  Future<List<SubscriptionPlanItem>> plans(String userId) async => const [
        SubscriptionPlanItem(
          plan: 'free',
          title: 'Базовый',
          priceKzt: 0,
          documentLimit: 2,
          voiceMinutes: 15,
          expertReview: false,
        ),
        SubscriptionPlanItem(
          plan: 'standard',
          title: 'Профессиональный',
          priceKzt: 7990,
          documentLimit: 30,
          voiceMinutes: 180,
          expertReview: true,
        ),
      ];

  @override
  Future<List<PaymentHistoryItem>> paymentHistory(String userId) async =>
      const [
        PaymentHistoryItem(
          plan: 'standard',
          amountKzt: 7990,
          status: 'paid',
        ),
      ];

  @override
  Future<PaymentIntentResult> createPaymentIntent(
          String userId, String plan) async =>
      const PaymentIntentResult(
        blocker: 'PAYMENT_PROVIDER_REQUIRED',
        amountKzt: 7990,
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
