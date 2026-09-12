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
  'localStorage.setItem("ai-lawyer-web-state"',
  'localStorage.getItem("ai-lawyer-web-state"',
  'type="file"',
  'capture="environment"',
  'crypto.subtle.digest("SHA-256"',
  "profileTypeMap",
  "application/pdf",
  "startAuth(",
  "verifyOtp",
  "profileRequired",
  "profileComplete",
  "Фамилия",
  "Отчество",
  "Город",
  "Завершить регистрацию",
  "Добро пожаловать",
  "authTabs",
  "phoneField",
  "loginPhoneRow",
  "loginRegisterHint",
  "setView(\"register\")",
  "setView(\"home\")",
  "saveProfile",
  "exportAccount",
  "deleteAccount",
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
  "authActionRow",
  "authFormCard",
  "otpBoxes",
  "languageTabs",
  "categoryHero",
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
  "Готовность дела:",
  "Не хватает документов",
  "Свидетельство о рождении ребенка",
  "Справка о доходах",
  "Сканировать камерой",
  "Выбрать из файлов",
  "Сделать фото",
  "Документы анализируются",
  "OCR завершен",
  "Проверка реквизитов",
  "82%",
  "Прогресс подготовки",
  "Текст претензии формируется",
  "Досудебная претензия",
  "Проверено AI",
  "Требует подтверждения",
  "Выберите способ отправки",
  "Сохранить как черновик",
  "Прогресс дела",
  "Участники дела",
  "Сумма и требования",
  "Сформировать документ",
  "Май 2024",
  "Сроки рассчитываются автоматически",
  "Популярные запросы",
  "Заполненность профиля",
  "Мои профили",
  "Голосовой помощник",
  "Конфиденциальность",
  "Использование в августе",
  "Выберите план",
  "Быстрые действия",
  "Служба поддержки онлайн",
  "Завершить запись",
  "Пауза",
  "recordCard",
  "Только реальные сохраненные данные",
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
