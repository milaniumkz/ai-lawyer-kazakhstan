import { readFileSync } from "node:fs";

const page = readFileSync("apps/web/app/page.tsx", "utf8");
const css = readFileSync("apps/web/app/styles.css", "utf8");
const failures = [];

const requiredScreens = [
  "Онбординг",
  "Вход и регистрация",
  "Регистрация пользователя",
  "SMS подтверждение",
  "Биометрия",
  "Главный экран",
  "Новое дело",
  "Категория спора",
  "Проверка документов",
  "Загрузка документа",
  "Анализ документов",
  "Формирование претензии",
  "Проект претензии",
  "Отправка претензии",
  "Мои дела",
  "Карточка дела",
  "Чат по делу",
  "Календарь и сроки",
  "Нормы права",
  "Поиск нормы права",
  "Документы и доказательства",
  "Профиль",
  "Настройки",
  "Подписка",
  "Помощь",
];

const requiredActions = [
  "Рассказать проблему",
  "Синхронизировать",
  "Продолжить",
  "Продолжить работу",
  "Открыть документы",
  "Загрузить документы",
  "Сканировать камерой",
  "Выбрать из файлов",
  "Сделать фото",
  "Документы анализируются",
  "Сформировать претензию",
  "Найти норму",
  "Отправить",
  "Сохранить профиль",
  "Экспортировать данные",
  "Удалить аккаунт",
  "syncWithApi(",
  "addCase(",
  "sendMessage(",
  "addDocument(",
  "handleFileSelection(",
  "ensureRemoteCaseForDocumentUpload(",
  'localStorage.setItem("ai-lawyer-web-state"',
  'localStorage.getItem("ai-lawyer-web-state"',
  'type="file"',
  "nativeUploadControl",
  'source: "file" | "camera"',
  'capture={source === "camera" ? "environment" : undefined}',
  'crypto.subtle.digest("SHA-256"',
  "Фото не выбрано или доступ к камере отменен",
  "Ошибка загрузки документа:",
  "Метаданные сохранены",
  "profileTypeMap",
  "application/pdf",
  "startAuth(",
  "verifyOtp",
  "profileRequired",
  "profileComplete",
  "Фамилия",
  "Отчество",
  "Город",
  "Создать аккаунт",
  "loginExactScreen",
  "loginExactLanguages",
  "loginExactPhone",
  "loginExactPhoneAction",
  "loginExactRegisterFooter",
  "authExactOverlay",
  "authExactModal",
  "authExactPanel",
  "setView(\"register\")",
  "setView(\"home\")",
  "saveProfile",
  "exportAccount",
  "deleteAccount",
  "logoutUser",
  "/auth/logout-all",
  "Выйти из аккаунта",
  "saveSettings",
  "createSupportRequest",
  "analyzeDocuments",
  "confirmClaimSent",
  "toggleNotifications",
  "continueCaseIntake",
  "selectLegalTab",
  "toggleLegalFilter",
  "notificationOpen",
  "legalActiveOnly",
  "finishRecording",
  "startRecording",
  "pauseRecording",
  "MediaRecorder",
  "navigator.mediaDevices.getUserMedia",
  "speechDraftRef",
  "recognizedText",
  "Текст распознан локально. Войдите для синхронизации аудио",
  "voicePlayback",
  "Transcript job",
  "ensureUser",
  "draftCaseId",
  "remoteCaseDraftId",
  "startNewCaseDraft",
  "currentDraftCaseCreated",
  "Новое дело не создано",
  "Сначала ответьте на вопросы AI и повторите анализ",
  "confirmOcr",
  "runLegalSearch",
  "generateClaim",
  "loadSubscription",
  "toggleTask",
  "apiForm(",
  "/voice/transcripts/audio",
  "audioBlobRef",
  "selectedCategory",
  "remoteCaseId",
  "remoteDocumentId",
  "appStatus",
  "data-theme={theme}",
  'aria-label="Назад"',
  "authMark",
  "goldDivider",
  "loginExactAction",
  "loginExactEmailAction",
  "loginExactBioAction",
  "otpBoxes",
  "loginExactTab",
  "aizanCategoryCard",
  "categoryAlternatives",
  "docReadinessCard",
  "docChecklist",
  "uploadHero",
  "uploadActions",
  "analysisHero",
  "analysisTimeline",
  "claimBuildHero",
  "claimSteps",
  "claimPaper",
  "sendMethods",
  "caseFilters",
  "caseDetailHero",
  "caseProgressRail",
  "chatCaseCard",
  "caseCalendar",
  "deadlineList",
  "popularQueries",
  "profileHero",
  "settingsGroup",
  "subscriptionHero",
  "usageBars",
  "planCards",
  "helpGrid",
  "supportOnline",
  "Уверенность:",
  "Возможные альтернативы",
  "Документы в деле:",
  "Не хватает документов",
  "Договор или основание требования",
  "Данные ответчика",
  "Сканировать камерой",
  "Выбрать из файлов",
  "Сделать фото",
  "Документы анализируются",
  "Проверка текста",
  "Проверка реквизитов",
  "Ожидает проверки",
  "Прогресс подготовки",
  "Текст претензии формируется",
  "Досудебная претензия",
  "Требует вашей проверки",
  "Требует подтверждения",
  "Выберите способ отправки",
  "Сохранить как черновик",
  "Прогресс дела",
  "Участники дела",
  "Сумма и требования",
  "Сформировать документ",
  "Юридические сроки требуют проверки",
  "Юридические сроки требуют проверки",
  "Популярные запросы",
  "Заполненность профиля",
  "Мои профили",
  "Голосовой помощник",
  "Конфиденциальность",
  "Использование",
  "Выберите план",
  "Быстрые действия",
  "Служба поддержки",
  "Завершить запись",
  "Пауза",
  "recordCard",
  'data-design="aizan"',
  "Фиктивные",
  "Нет подтвержденной нормы",
  'view: "onboarding"',
  'view: "login"',
  'view: "register"',
  'view: "otp"',
  'view: "biometric"',
  'view: "newCase"',
  'view: "category"',
  'view: "documentCheck"',
  'view: "documentUpload"',
  'view: "legalSearch"',
  'view: "claimDraft"',
  'view: "claimSend"',
  "/auth/register",
  "/auth/otp/verify",
  "/account/export",
  "/account",
  "/cases",
  "/rag/answer",
];

for (const screen of requiredScreens) {
  if (!page.includes(screen))
    failures.push(`web page missing design screen: ${screen}`);
}

for (const action of requiredActions) {
  if (!page.includes(action))
    failures.push(`web page missing action: ${action}`);
}

const cssNeedles = [
  '.appShell[data-theme="light"]',
  "@media (max-width: 980px)",
  "@media (max-width: 620px)",
  ".appShell",
  ".deviceFrame",
  ".bottomNav",
  ".sidebar",
  ".rightPanel",
  ".compactTiles",
  ".topActions",
  ".quickIcon",
  ".screenHeader",
  ".loginPanel",
  "background-auth-cropped-20260930.jpg",
  '.appShell[data-view="login"] .bottomNav',
  '.appShell[data-view="register"] .bottomNav',
  '.appShell[data-view="otp"] .bottomNav',
  '.appShell[data-view="login"] .appStatus',
  ".recordCard",
  ".wave",
  "grid-template-columns: repeat(5, 1fr)",
];

for (const needle of cssNeedles) {
  if (!css.includes(needle))
    failures.push(`web css missing adaptive/design rule: ${needle}`);
}

if (/onClick=\{\(\) => \{\}\}/.test(page))
  failures.push("web page contains empty onClick handler");
for (const forbidden of [
  "fileInputRef.current?.click()",
  "scanInputRef.current?.click()",
  "input.click()",
  "openFilePicker(",
  "if (file) void addDocument",
  "Документ локально, API ошибка",
  "Для API сохранения сначала создайте дело",
  "Файл добавлен из браузера",
]) {
  if (page.includes(forbidden))
    failures.push(`web upload still bypasses real action contract: ${forbidden}`);
}
for (const required of [
  "function UploadControl",
  "nativeUploadControl",
  'source === "camera"',
  "handleFileSelection(event.target.files?.[0], source)",
  'caseId = await ensureRemoteCaseForDocumentUpload()',
  'go("documentCheck")',
]) {
  if (!page.includes(required))
    failures.push(`web upload action contract missing: ${required}`);
}
for (const forbidden of [
  "Скан документа ${documents.length + 1}.jpg",
  'setSyncState("Настройки сохранены")',
  "setHelpStatus(`Обращение создано:",
  'setSent(true); updateActiveCase("Отправка претензии зафиксирована"',
  'onClick={() => go("home")}>Уже есть аккаунт',
  'onClick={() => go("category")}>{recording ?',
  "onClick={() => setLegalTab(tab)}",
  'onClick={() => setSyncState("Фильтр: действующие редакции")}',
  'onClick={() => setSyncState("Новых уведомлений нет")}',
]) {
  if (page.includes(forbidden))
    failures.push(`web page still has status-only action: ${forbidden}`);
}
if (/defaultValue=/.test(page))
  failures.push("web page still uses static defaultValue form fields");
if (page.includes("00:47"))
  failures.push("web page still uses fake recording timer");
for (const forbidden of [
  "Стенд готов",
  "RC internal validation",
  "Release Candidate",
  "API demo не запускался",
]) {
  if (page.includes(forbidden))
    failures.push(`web app still contains stand marker: ${forbidden}`);
}
for (const forbidden of ['className="screenList"', "Проверка 25 экранов"]) {
  if (page.includes(forbidden))
    failures.push(`web app still exposes QA screen matrix: ${forbidden}`);
}
for (const required of [
  '<aside className="sidebar"',
  '<aside className="rightPanel"',
]) {
  if (!page.includes(required))
    failures.push(`web app missing desktop wrapper: ${required}`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("web ui contract ok");
