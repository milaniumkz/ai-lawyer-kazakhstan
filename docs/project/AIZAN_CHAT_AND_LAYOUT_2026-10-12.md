# Веб-дизайн и диалог OpenAI

Проверены 25 экранов на телефоне и компьютере. Общие стили устраняют белые
кнопки браузера, переполнение текста и тесную компоновку этапов претензии.
Рабочая область на компьютере расширена до 960 px; мобильные формы сохраняют
свою ширину. Исправлены отправка сообщения, шкала дела, фильтры задач и
положение форм входа. Регрессионная проверка охватывает 25 экранов × 8 размеров,
включая 320, 1440 и 1920 px, и проверяет фактически открытый экран.

Когда OpenAI настроен, главная страница начинает сохранённый диалог дела.
Помощник уточняет обстоятельства, даты, заявителя, получателя, контакты,
требования, доказательства и срок. Сервер показывает точное резюме извлечённых
данных. Подтверждение относится к этому резюме; изменение данных требует
повторного подтверждения. История и состояние диалога сохраняются в PostgreSQL
(`messages.ai_context`, миграция 0013).

Поиск через OpenAI Responses `web_search` ограничен официальными доменами РК.
Ссылки для проекта должны присутствовать в фактическом результате поиска.
Перед готовностью проекта сервер независимо загружает официальные страницы
и проверяет дословные цитаты. Переходы на посторонние домены, отсутствующие
цитаты и неподтверждённые ссылки блокируют готовность. Дату редакции и
применимость оценивает модель; совпадение текста не заменяет правовую экспертизу.
Документ всегда сохраняется как проект, требующий проверки пользователем и
юристом. Полнота корпуса и отсутствие юридических ошибок не гарантируются.

Готовую претензию можно сохранить, редактировать и скачать в PDF внутри главной
страницы. Сервер берёт полный текст именно из последнего подтверждённого
AI-сообщения, а не из шаблона с вымышленными реквизитами. Flutter также использует
этот текст при сохранении готового проекта из переписки. Ручной режим остаётся
явно доступным. Ошибка OpenAI не выдаётся за успешный ответ; текст остаётся
для повторной отправки. SMS, OCR, платежи и внешняя доставка не подключались.

Проверки: полный `npm run check` (112 API, 54 Flutter, 7 AI), сборка веба/admin/API,
Docker Compose, PostgreSQL с перезапуском, настоящий ручной браузерный сценарий.
Отдельный `scripts/web/check-openai-conversation.mjs` проверяет реальную нейросеть,
уточнение получателя, подтверждённый проект, официальные цитаты, восстановление,
сохранение документа и PDF. Он использует синтетическую учётную запись и удаляет
её после проверки; успешные ответы не подменяются.

Для диалога используется отдельный `AI_CONVERSATION_TIMEOUT_MS` (120 секунд по умолчанию); прежний таймаут коротких ответов не обрывает подготовку. До сбора фактов поиск отключён, кроме явного запроса правовых норм.

Если первоначальный текст содержит неподтверждённые ссылки, нейросеть заново составляет документ только из независимо проверенных норм. Непроверенные ссылки не переносятся в новый текст. Одна официальная страница загружается один раз для всех цитат этого запроса.

Новый viewer «Әділет» отдаёт JavaScript-оболочку. Для зарегистрированного акта reader использует официальную старую версию, на которую ссылается сам публичный клиент издателя, и проверяет цитату там. В документе сохраняется фактически проверенный официальный URL.

Подтверждение неизменённых фактов сохраняется независимо от доступности источников. Ответ «спасибо» или вопрос о PDF не удаляет готовый проект и не меняет дату проверки норм; сохраняется исходный идентификатор проекта для защиты от дубликатов.

Полный живой сценарий подтверждён успешным [серверным прогоном 38223836600](https://github.com/milaniumkz/ai-lawyer-kazakhstan/actions/runs/38223836600) для версии веб/API `8d738f5`: реальный OpenAI, уточнения, полное резюме, подтверждение, официальные цитаты, полный проект, дополнительный вопрос о PDF, перезагрузка, один сохранённый документ и настоящий PDF. Обычный сценарий документов/задач/обращений также прошёл. Успешные API-ответы в этом прогоне не подменялись.

Проверка источников может не разрешить подготовку, если официальный текст недоступен или цитата не подтверждается. В таком случае факты сохраняются, можно повторить поиск; непроверенные ссылки не выдаются за подтверждённые. Это ограничение отличается от доступности самой нейросети.

Финальная версия `e79b840` дополнительно требует реальный вызов поиска, когда нужны правовые основания. Она подтверждена успешным [полным прогоном 38225676250](https://github.com/milaniumkz/ai-lawyer-kazakhstan/actions/runs/38225676250), включая настоящий OpenAI, сохранение после дополнительного сообщения и PDF. Независимая серверная проверка reader получила полный текст «Әділет» (709067 нормализованных символов) и нашла положения о займе и возврате денег.

### Sequential clarifications and inline voice input

The assistant now explicitly asks one short clarification at a time, retains already supplied facts and omits premature summaries of unknown fields. A regression check covers the screenshot's numbered question followed by an unknown-fields summary. The complete facts summary still appears before confirmation and claim composition.

The home composer includes an accessible microphone beside the text field, with a recording state and stop action. Empty recording blobs do not create playback URLs; successful message submission clears the previous recording. Local Chromium checks passed at widths 320, 390, 768 and 1920: microphone visibility, no overflow, denied microphone access preserves the reply, no empty player, conversation stays on home. Full check passed (113 API, 54 Flutter, 7 AI tests); build and Docker configuration passed. Real microphone hardware is not available in the cloud browser.

### Contextual attachments and compact dictation

The conversation response now includes `requiresDocument`, enabled only when the assistant asks for a specific document. The home upload control follows that request and disappears once the requested file is saved or the assistant moves to another question. Ordinary intake does not show a permanent attachment button. Dedicated document screens remain available for managing files.

Home dictation uses the inline microphone and square stop control, with elapsed time inside the input. The lower recording controls and audio player are removed from home; recognized speech remains editable text. Recognition failures provide a retry/type message. Chromium UI fixtures verified ordinary/requested/completed attachment states and real MediaRecorder start/stop with synthetic audio, without a home audio player. Full check, build and Docker configuration passed. The deployed intake test now exercises the dedicated document screen for an unsolicited upload.

### Message composer and actual photo analysis

The send arrow, microphone/stop and contextual attachment control now live inside the home input. Enter sends, Shift+Enter adds a line. Pending attachments have cards and authenticated photo thumbnails; sent attachments remain in the message history. Waiting appears as an assistant typing indicator in the conversation. A failed request restores the original text and pending photo.

Messages accept up to five case-owned photo IDs, with a combined 25 MiB limit. The API checks ownership, upload status, stored size and SHA-256, then passes actual image bytes to the existing OpenAI Responses adapter. Only metadata is persisted in the new additive migration 0014; bytes and provider credentials are not included in message JSON. Foreign files, corrupted contents, retry changes and unsupported formats are rejected. PDF transmission to external OpenAI was rejected by automatic approval review as separately unauthorized; PDF/other files remain available in document management but are excluded from model input. Supported photo uploads for this workflow are JPG/PNG.

The live deployment check now uploads a synthetic image with a random visual code absent from the text prompt, checks the actual model's answer, thumbnails and history after reload, then exercises confirmed claim generation and PDF download. One transient provider timeout can be retried with the same retained message; persistent failure still fails the check. Conversation timeout defaults to 150 seconds within the existing 180-second frontend/proxy budget.

Local validation: 115 API tests, 54 Flutter tests, 7 AI tests; full check/build/Docker configuration passed. PostgreSQL restart preserves attachment metadata. Chromium checks cover controls inside the input at 320/390/768/1920, attachment cards, typing indicator, outage restoration and no home audio player. The real local API intake/document/PDF workflow passed. Real cloud microphone hardware remains unavailable.

Deployed photo verification succeeded in run 38238727118: the real model read the random image code and the browser retained the thumbnail/card after reload. The subsequent legal-source check failed safely with zero verified citations; no unsupported claim was emitted. The live check now exercises one explicit repeat of the official-source search with unchanged confirmed facts before requiring a verified full claim. Persistent verification failure still fails the run.

Final deployed verification: runtime commit 54b3ba8; verify-only run 38239870770 (test commit 2e244f9). Manual document workflow passed. Actual photo/code recognition and thumbnail/history reload passed for the second time. Confirmed-source claim generation did not pass: one provider timeout, then zero verified citations, and an explicit repeated search still produced no ready draft. The application did not emit an unsupported document. These failures remain an unresolved limitation of the broader legal-generation workflow; do not describe the complete legal scenario as validated by these runs. The requested composer, contextual upload, voice UI and actual photo-reading changes are deployed and verified.

### Full page layout review after profile screenshot

Fixed the actual menu grid defect: rows without an icon were assigned the narrow icon column. Profile and help rows now use a flexible text column and trailing arrow; mobile titles and secondary text have readable sizes. Corrected the squeezed analysis status panel, fixed-height help shortcuts, tiny settings/plan/usage labels, search fields and clear controls. Progress bars use the gold palette. The review includes browser screenshots of all 25 screens on mobile and desktop plus 200 layout combinations (25 screens × eight widths), including checks for compressed text columns and actual control clipping. Active navigation dots are decorative and intentionally sit below their buttons; other vertical control overflow is checked.

Full quality check passed (115 API, 54 Flutter, seven AI tests), build and Docker configuration passed. A visual-only deployment option runs the real manual document workflow and all responsive screens on the deployed server. It does not rerun the unrelated, previously failing OpenAI legal-source scenario, whose unresolved limitation is recorded above.

### iPhone release preparation

The installed iOS app and its App Store icon require a newly signed binary. Existing local App Store metadata refers to an earlier uploaded build; the current cloud workspace has no Apple API key, signing identity or Xcode. The user confirmed the keys are only on their Mac. Added a macOS candidate job to compile the current AIZAN app/icon and capture all 23 native routes without publishing. Added a Mac release helper that uses the existing key/keychain locally, reads live App Store build/version metadata, builds the next signed IPA and, with `--upload`, uploads/selects an editable draft. It does not cancel reviews or submit/release a version. No private key needs to be pasted into chat.

The first deployed responsive run measured the SSR login page before remote hydration. The check now waits for the requested real screen and loaded fonts before inspecting layout; the wrong-screen assertion is preserved. Local 200-layout checks passed; deployed verification is repeated with this timing correction.

The Apple API client now refreshes its signed JWT before expiry during long builds/Apple processing. A local synthetic EC-key/transport check verified refresh without any external request or credential output; the complete quality check and Docker configuration passed. The Mac helper builds against live App Store version/build metadata instead of blindly reusing the old documented build number.

The hydrated deployed run reached all pages and found one genuine 320px legal-search tab clipping issue (`Разъяснения`). Legal tabs now use readable 44px touch targets, wrapping flexible rows on larger screens and a two-column mobile layout, with the final odd tab spanning the row. Focused Chromium checks passed for both legal views at all eight widths; full quality check/build/Docker configuration passed. A final visual release repeats the deployed 200-layout check.

### Native review and Mac-only signing

The final web deployment at `f612f59` passed the real manual workflow and all 200 responsive layouts in run 38247576011. The unsigned iOS release compiled in run 38245690077; its per-screen rebuild capture reached the 45-minute limit after 16 native screenshots, so that run is cancelled rather than a successful full review. Those actual screenshots exposed a help tile overflow, inherited teal selections/progress and duplicated auth/profile/settings/help titles. Fixed tile spacing, allowed two-line captions, supplied gold secondary/progress/selection colors and used the existing AIZAN logo header. Four changed visual regression references were inspected before updating.

Native capture now compiles once. A debug-only, explicitly enabled preview flag reads a simulator child environment route and confirms the selected route after the first frame in an ephemeral simulator sandbox file. Each screen launches the same application and is captured only after that confirmation; a missing confirmation fails the run. Signed release builds do not enable the flag. New-case autofocus is suppressed only in this preview mode to avoid the simulator keyboard onboarding covering the page.

Apple signing and API access are only on the user's Mac. No signed upload, App Store review/release or installation on the user's iPhone has occurred from this cloud environment. From the project repository on that Mac, this sequence preserves the existing working tree and runs the latest release helper:

```sh
git fetch origin deploy/aizan-server
AIZAN_RELEASE_DIR=$(mktemp -d /tmp/aizan-release.XXXXXX)
git archive FETCH_HEAD | tar -x -C "$AIZAN_RELEASE_DIR"
cd "$AIZAN_RELEASE_DIR"
node scripts/release/build-ios-on-mac.mjs --upload
```

The helper uses the existing local key/keychain, determines the next build from live Apple metadata, uploads the signed binary and selects it in an editable App Store draft. It deliberately does not submit for review or publish. App Store icon changes require Apple approval/release; installed iPhone icon/design changes require installing that updated binary. The helper's execution on the Mac remains unverified until Mac access or its result is available.

### Chat entry captions

Once the home chat opens, the web hides the redundant top “Ввести текст” button and idle microphone caption. Flutter home-chat entry also hides the introductory problem heading and idle voice hint. Recording status remains visible. Existing installed iOS binaries require a new signed build to receive this change.

### Transparent in-app artwork and recording pulse

Replaced the screenshot crops for the in-app logo and round microphone with isolated alpha-transparent PNG assets shared by web and Flutter. The app launcher/App Store icon is a separate asset. The large microphone pulses in scale and gold glow only while recording, stops on pause/stop, and respects reduced-motion settings. Chromium verified rendering, moving animation frames and reduced-motion behavior locally; this does not test physical microphone hardware. Flutter golden capture now waits for actual image decoding so the initial screen cannot pass with missing artwork. Recording lifecycle tests advance frames while the intentional repeating animation runs, and still verify completion/transcription/upload afterward.

### Launcher icon and display name

Changed native iOS/Android display names, Flutter application/onboarding title and installed web-app metadata to `Айзан`. The launcher icon now contains only a larger gold monogram, with the separate AIZAN wordmark removed. All iOS catalog sizes, Android density variants, web/PWA/touch icons and favicon are generated from the opaque 1024px master using `node scripts/mobile/build-launcher-icons.mjs`. Small-size preview inspected at 60px and 96px. The transparent in-app logo remains a separate asset. Source changes do not rename an existing App Store listing or update installed iPhone binaries; those still require the Mac/Apple release process.

### Opaque native navigation transitions

Each GoRouter page now paints its own opaque AIZAN gradient. Previously transparent Scaffolds relied on a single background outside Navigator, causing underlying page content to show through during iOS transitions. Kept the platform's native transitions and back navigation rather than adding overlapping content fades. A regression test exercises iOS push/pop and verifies full-screen opaque page backgrounds at intermediate animation frames. Full quality check and Docker configuration passed; installation on a physical iPhone still requires a new signed build.
