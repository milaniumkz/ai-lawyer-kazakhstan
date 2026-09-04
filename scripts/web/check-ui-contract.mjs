import { readFileSync } from 'node:fs';

const page = readFileSync('apps/web/app/page.tsx', 'utf8');
const css = readFileSync('apps/web/app/styles.css', 'utf8');
const failures = [];

const requiredScreens = [
  'Онбординг',
  'Вход и регистрация',
  'Регистрация пользователя',
  'SMS подтверждение',
  'Биометрия',
  'Главный экран',
  'Новое дело',
  'Категория спора',
  'Проверка документов',
  'Загрузка документа',
  'Анализ документов',
  'Формирование претензии',
  'Проект претензии',
  'Отправка претензии',
  'Мои дела',
  'Карточка дела',
  'Чат по делу',
  'Календарь и сроки',
  'Нормы права',
  'Поиск нормы права',
  'Документы и доказательства',
  'Профиль',
  'Настройки',
  'Подписка',
  'Помощь',
];

const requiredActions = [
  'Рассказать проблему',
  'Синхронизировать',
  'Подтвердить и создать дело',
  'Продолжить работу',
  'Открыть документы',
  'Загрузить файл',
  'Сканировать документ',
  'Подтвердить поля',
  'Анализировать документы',
  'Сформировать претензию',
  'Найти норму',
  'Отправить',
  'Сохранить профиль',
  'syncWithApi(',
  'addCase(',
  'sendMessage(',
  'addDocument(',
  'localStorage.setItem("ai-lawyer-web-state"',
  'localStorage.getItem("ai-lawyer-web-state"',
  'type="file"',
  'startAuth(',
  'verifyOtp',
  'saveProfile',
  'appStatus',
  'data-theme={theme}',
  'Задержка зарплаты',
  'работодател',
  'зарплат',
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
  '/auth/register',
  '/auth/otp/verify',
  '/cases',
  '/rag/answer',
];

for (const screen of requiredScreens) {
  if (!page.includes(screen)) failures.push(`web page missing design screen: ${screen}`);
}

for (const action of requiredActions) {
  if (!page.includes(action)) failures.push(`web page missing action: ${action}`);
}

const cssNeedles = [
  '.appShell[data-theme="light"]',
  '@media (max-width: 980px)',
  '@media (max-width: 620px)',
  '.appShell',
  '.deviceFrame',
  '.bottomNav',
  '.topActions',
  '.quickIcon',
  'grid-template-columns: repeat(5, 1fr)',
];

for (const needle of cssNeedles) {
  if (!css.includes(needle)) failures.push(`web css missing adaptive/design rule: ${needle}`);
}

if (/onClick=\{\(\) => \{\}\}/.test(page)) failures.push('web page contains empty onClick handler');
if (/defaultValue=/.test(page)) failures.push('web page still uses static defaultValue form fields');
for (const forbidden of ['Стенд готов', 'RC internal validation', 'Release Candidate', 'API demo не запускался']) {
  if (page.includes(forbidden)) failures.push(`web app still contains stand marker: ${forbidden}`);
}
for (const forbidden of ['className="screenList"', 'Проверка 25 экранов']) {
  if (page.includes(forbidden)) failures.push(`web app still exposes QA screen matrix: ${forbidden}`);
}
for (const forbidden of ['<aside className="sidebar"', '<aside className="rightPanel"']) {
  if (page.includes(forbidden)) failures.push(`web app still renders desktop wrapper: ${forbidden}`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('web ui contract ok');
