# Design Parity Matrix

Дата: 2026-09-05.

Источник дизайна:

- Dark: `дизайн/темная`, 25 PNG.
- Light: `дизайн/светлая `, 20 PNG.
- PNG используются только как reference. UI реализуется нативными компонентами web/Flutter.

## Токены

| Token | Web | Flutter | Admin | Статус |
|---|---|---|---|---|
| Dark background | `#06111d` app / `#071421` core | `0xFF071421` | `#071421` | aligned |
| Dark surface | `#0d1a28`, `#101f2f` | `0xFF101D2A` | `#101d2a` | aligned |
| Light background | `#fbf7ef` | `0xFFFBF7EF` | `#fbf7ef` | aligned |
| Light surface | `#ffffff` | `0xFFFFFFFF` | `#ffffff` | aligned |
| Text dark/light | `#f8f4ec`, `#20272c` | `0xFF20272C`, dark text white | `#f8f4ec`, `#20272c` | aligned |
| Gold accent | `#d8a13a`, `#e6bd62` | `0xFFD8A13A`, `0xFF9B6A16` | `#d8a13a`, `#9b6a16` | aligned |
| Card radius | `20px`, frame `34px` | `20`, controls `18` | `20`, controls `18` | aligned |
| Mobile reference viewport | `390x844` target, PNG `941x1672` | test viewport `941x1672` | n/a | controlled |

## Screen Matrix

| # | Макет | Web view | Flutter route/widget | Основные действия |
|---|---|---|---|---|
| 01 | Онбординг | `onboarding` | `/onboarding` / `OnboardingScreen` | route to login/register |
| 02 | Вход и регистрация | `login` | `/login` / `LoginScreen` | OTP request API, route register |
| 03 | Регистрация пользователя | `register` | `/register` / `RegisterScreen` | OTP request API, consent |
| 04 | SMS подтверждение | `otp` | `/otp` / `OtpScreen` | OTP verify API, resend |
| 05 | Биометрия / быстрый вход | `biometric` | `/biometric` / `BiometricScreen` | local biometric flag, continue |
| 06 | Главный экран | `home` | `/` / `HomeScreen` | voice entry, quick routes, notifications |
| 07 | Новое дело голосом | `newCase` | `/case/new` / `NewCaseScreen` | microphone recording, STT, transcript |
| 08 | Категория спора | `category` | `/case/category` / `CategoryScreen` | category select, create case API |
| 09 | Проверка документов | `documentCheck` | `/documents` / `DocumentsScreen` | OCR confirm, upload route |
| 10 | Загрузка документа | `documentUpload` | `/documents` / `DocumentsScreen` | file/camera picker, upload session API |
| 11 | Анализ документов | `analysis` | `/documents/analysis` / `DocumentAnalysisScreen` | OCR-gated analysis, route claim |
| 12 | Формирование претензии | `claim` | `/workflow/pretrial-claim` / `PretrialClaimScreen` | template/generate API |
| 13 | Проект претензии | `claimDraft` | `/workflow/pretrial-claim/draft` / `ClaimDraftScreen` | preview/edit, expert flag |
| 14 | Отправка претензии | `claimSend` | `/workflow/pretrial-claim/send` / `ClaimSendScreen` | assisted/manual submission blocker |
| 15 | Мои дела | `cases` | `/cases` / `CasesListScreen` | search/filter, open case |
| 16 | Карточка дела | `case` | `/case/details` / `CaseDetailsScreen` | chat/docs/claim routes |
| 17 | Чат по делу | `chat` | `/case/chat` / `CaseChatScreen` | messages API, local fallback |
| 18 | Календарь и сроки | `deadlines` | `/deadlines` / `DeadlinesScreen` | task toggles, status update |
| 19 | Нормы права | `legal` | `/legal` / `LegalSourcesScreen` | official source cards, filters |
| 20 | Поиск нормы права | `legalSearch` | `/legal` / `LegalSourcesScreen` | RAG answer API, citations |
| 21 | Документы и доказательства | `documents` | `/documents` / `DocumentsScreen` | file list, evidence state |
| 22 | Профиль | `profile` | `/profile` / `ProfileScreen` | profile save API, type switch |
| 23 | Настройки | `settings` | `/settings` / `SettingsScreen` | persisted settings, export/delete |
| 24 | Подписка | `subscription` | `/subscription` / `SubscriptionScreen` | limits API, payment blocker |
| 25 | Помощь | `help` | `/help` / `HelpScreen` | support request state |

## Action Contract

Каждая интерактивная кнопка обязана выполнять ровно понятное действие:

- API call для backend-состояния.
- Route transition для навигации.
- Local persisted state для настроек/локальных флагов.
- File picker/upload для документов.
- Microphone recording/STT для голоса.
- Dialog/blocker для внешних production-интеграций без ключей.

Запрещено:

- пустые handlers;
- случайные demo/status-only handlers;
- fake government/payment/SMS production behavior;
- PNG как фон вместо нативного UI.
