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
