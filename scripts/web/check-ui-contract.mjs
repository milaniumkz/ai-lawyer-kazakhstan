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
  'Начать дело',
  'API:',
  'AI:',
  'Выполнить',
  'На проверку',
  'Blocker',
  'runFlow(',
  'runFlowAction(',
  'openScreen(',
  'checkHealth(',
];

for (const screen of requiredScreens) {
  if (!page.includes(screen)) failures.push(`web page missing design screen: ${screen}`);
}

for (const action of requiredActions) {
  if (!page.includes(action)) failures.push(`web page missing action: ${action}`);
}

const cssNeedles = [
  '@media (prefers-color-scheme: dark)',
  '@media (max-width: 860px)',
  '@media (max-width: 520px)',
  '.screenGrid',
  '.workspace',
  '.phone',
  'grid-template-columns: repeat(2, minmax(0, 1fr))',
];

for (const needle of cssNeedles) {
  if (!css.includes(needle)) failures.push(`web css missing adaptive/design rule: ${needle}`);
}

if (/onClick=\{\(\) => \{\}\}/.test(page)) failures.push('web page contains empty onClick handler');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('web ui contract ok');
