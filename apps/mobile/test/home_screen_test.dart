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
  });

  test('generated API contract exposes auth and case paths', () {
    expect(ApiContract.authRegister, '/auth/register');
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
    await tester.tap(find.text('Начать'));
    await tester.pumpAndSettle();
    expect(find.text('Вход и регистрация'), findsWidgets);

    await tester.pumpWidget(const AiLawyerApp(initialLocation: '/onboarding'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Уже есть аккаунт'));
    await tester.pumpAndSettle();
    expect(find.text('Рассказать проблему'), findsOneWidget);
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
      ['/case/category', 'Определение категории спора'],
      ['/case/chat', 'Чат по делу'],
      ['/documents', 'Документы и доказательства'],
      ['/documents/analysis', 'Анализ документов'],
      ['/deadlines', 'Календарь и сроки'],
      ['/legal', 'Официальные источники РК'],
      ['/workflow/pretrial-claim', 'Конструктор документа'],
      ['/workflow/pretrial-claim/draft', 'Проект досудебной претензии'],
      ['/workflow/pretrial-claim/send', 'Отправка претензии'],
      ['/subscription', 'Лимиты и расходы'],
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
    expect(find.text('Определение категории спора'), findsWidgets);

    await tester.tap(find.text('Трудовой спор'));
    await tester.pumpAndSettle();
    expect(find.text('Категория: Трудовой спор'), findsOneWidget);
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
    await tester.tap(find.text('ИП'));
    await tester.pumpAndSettle();
    expect(find.widgetWithText(ChoiceChip, 'ИП'), findsOneWidget);

    await tester.tap(find.text('Быстрый вход по биометрии'));
    await tester.pumpAndSettle();
    expect(find.text('Локальный secure flag включен'), findsOneWidget);

    await tester.tap(find.text('Настройки'));
    await tester.pumpAndSettle();
    expect(find.text('Скрывать ИИН/БИН в логах'), findsOneWidget);

    await tester.tap(find.text('Сохранить настройки'));
    await tester.pumpAndSettle();
    expect(find.text('Настройки сохранены'), findsOneWidget);

    await tester.tap(find.byKey(const ValueKey('nav-profile')));
    await tester.pumpAndSettle();
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
    await tester.pumpWidget(MaterialApp(home: ProfileScreen(profileApi: api)));

    await tester.ensureVisible(find.text('Сохранить профиль'));
    await tester.tap(find.text('Сохранить профиль'));
    await tester.pumpAndSettle();

    expect(api.savedUserId, 'user-1');
    expect(find.textContaining('Профиль сохранен'), findsOneWidget);
  });

  testWidgets('shows pretrial claim builder', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: PretrialClaimScreen()));

    expect(find.text('Конструктор документа'), findsOneWidget);
    expect(find.text('Сформировать проект'), findsOneWidget);
  });

  testWidgets('case intake voice button and create action work',
      (tester) async {
    await tester.pumpWidget(
        MaterialApp(home: NewCaseScreen(recorder: _FakeRecorder())));

    await tester.tap(find.byIcon(Icons.mic_none));
    await tester.pumpAndSettle();
    expect(find.text('Запись активна'), findsOneWidget);

    await tester.tap(find.byIcon(Icons.stop));
    await tester.pumpAndSettle();
    expect(find.text('Голос готов к обработке'), findsOneWidget);
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
                recorder: _FakeRecorder(), voiceApi: api, caseApi: cases),
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
    expect(cases.createdText, 'Голос отправлен в API');
    expect(find.text('Категория готова'), findsOneWidget);
  });

  testWidgets('chat sends messages through case API when case exists',
      (tester) async {
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

    await tester.tap(find.text('Загрузить файл'));
    await tester.pumpAndSettle();
    expect(find.text('Файл добавлен'), findsOneWidget);
    expect(docs.uploadedFileName, 'claim.pdf');

    await tester.tap(find.text('Сканировать документ'));
    await tester.pumpAndSettle();
    expect(find.text('Скан готов'), findsOneWidget);

    await tester.ensureVisible(find.text('Подтвердить поля'));
    await tester.tap(find.widgetWithText(FilledButton, 'Подтвердить поля'));
    await tester.pumpAndSettle();
    expect(find.text('Поля подтверждены'), findsOneWidget);
    expect(docs.ocrDocumentId, 'document-1');

    await tester.tap(find.text('Договор и переписка'));
    await tester.pumpAndSettle();
    expect(docs.evidenceCaseId, MobileCaseRuntime.activeCaseId);

    await tester.tap(find.text('Анализировать документы'));
    await tester.pumpAndSettle();
    expect(find.text('Анализ документов'), findsWidgets);
    await tester.tap(find.text('Подтвердить анализ'));
    await tester.pumpAndSettle();
    expect(find.text('Анализ завершен'), findsOneWidget);

    await tester.tap(find.text('Сформировать претензию'));
    await tester.pumpAndSettle();
    expect(find.text('Конструктор документа'), findsOneWidget);
  });

  testWidgets('pretrial claim draft and send flow works', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: ClaimDraftScreen()));
    await tester.pumpAndSettle();

    expect(find.text('Проект досудебной претензии'), findsWidgets);
    await tester.tap(find.text('Проверено пользователем'));
    await tester.pumpAndSettle();
    expect(find.widgetWithText(FilledButton, 'Перейти к отправке'),
        findsOneWidget);

    await tester.pumpWidget(const MaterialApp(home: ClaimSendScreen()));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Зафиксировать отправку'));
    await tester.pumpAndSettle();
    expect(find.text('Отправка зафиксирована'), findsOneWidget);
  });

  testWidgets('shows subscription budget screen', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: SubscriptionScreen()));

    expect(find.text('Лимиты и расходы'), findsOneWidget);
    expect(find.text('AI расходы считаются без персональных данных.'),
        findsOneWidget);
  });

  testWidgets('subscription payment button shows blocker dialog',
      (tester) async {
    await tester.pumpWidget(const MaterialApp(home: SubscriptionScreen()));

    await tester.tap(find.text('Управление оплатой недоступно в stub mode'));
    await tester.pumpAndSettle();

    expect(find.text('Оплата недоступна'), findsOneWidget);
    expect(find.textContaining('Payment provider'), findsOneWidget);
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

class _FakeVoiceApi implements VoiceTranscriptPort {
  String? uploadedPath;

  @override
  Future<VoiceTranscriptJob> uploadAudio({
    required String path,
    required String transcript,
  }) async {
    uploadedPath = path;
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

Future<void> setLargeViewport(WidgetTester tester) async {
  tester.view.physicalSize = const Size(941, 1672);
  tester.view.devicePixelRatio = 1;
  addTearDown(() {
    tester.view.resetPhysicalSize();
    tester.view.resetDevicePixelRatio();
  });
}
