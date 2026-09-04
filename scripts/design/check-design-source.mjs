import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const failures = [];
const mobileApp = readFileSync('apps/mobile/lib/main.dart', 'utf8');
const mobileDesignTest = readFileSync('apps/mobile/test/design_golden_test.dart', 'utf8');
const webPage = readFileSync('apps/web/app/page.tsx', 'utf8');
const darkDir = 'дизайн/темная';
const lightDir = 'дизайн/светлая ';
const compactMobileSize = { width: 941, height: 1672 };
const fullHdMobileSize = { width: 1080, height: 1920 };
const designScreens = [
  ['01', 'Онбординг', '/onboarding', 'OnboardingScreen'],
  ['02', 'Вход и регистрация', '/login', 'LoginScreen'],
  ['03', 'Регистрация пользователя', '/register', 'RegisterScreen'],
  ['04', 'SMS подтверждение', '/otp', 'OtpScreen'],
  ['05', 'Биометрия', '/biometric', 'BiometricScreen'],
  ['06', 'Главный экран', '/', 'HomeScreen'],
  ['07', 'Новое дело', '/case/new', 'NewCaseScreen'],
  ['08', 'Категория спора', '/case/category', 'CategoryScreen'],
  ['09', 'Проверка документов', '/documents', 'DocumentsScreen'],
  ['10', 'Загрузка документа', '/documents', 'DocumentsScreen'],
  ['11', 'Анализ документов', '/documents/analysis', 'DocumentAnalysisScreen'],
  ['12', 'Формирование претензии', '/workflow/pretrial-claim', 'PretrialClaimScreen'],
  ['13', 'Проект претензии', '/workflow/pretrial-claim/draft', 'ClaimDraftScreen'],
  ['14', 'Отправка претензии', '/workflow/pretrial-claim/send', 'ClaimSendScreen'],
  ['15', 'Мои дела', '/cases', 'CasesListScreen'],
  ['16', 'Карточка дела', '/case/details', 'CaseDetailsScreen'],
  ['17', 'Чат по делу', '/case/chat', 'CaseChatScreen'],
  ['18', 'Календарь и сроки', '/deadlines', 'DeadlinesScreen'],
  ['19', 'Нормы права', '/legal', 'LegalSourcesScreen'],
  ['20', 'Поиск нормы права', '/legal', 'LegalSourcesScreen'],
  ['21', 'Документы и доказательства', '/documents', 'DocumentsScreen'],
  ['22', 'Профиль', '/profile', 'ProfileScreen'],
  ['23', 'Настройки', '/settings', 'SettingsScreen'],
  ['24', 'Подписка', '/subscription', 'SubscriptionScreen'],
  ['25', 'Помощь', '/help', 'HelpScreen'],
];

function pngFiles(dir) {
  if (!existsSync(dir)) {
    failures.push(`missing design directory: ${dir}`);
    return [];
  }
  return readdirSync(dir)
    .filter((file) => file.endsWith('.png'))
    .sort()
    .map((file) => join(dir, file));
}

function dimensions(file) {
  const output = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', file], { encoding: 'utf8' });
  return {
    width: Number(output.match(/pixelWidth:\s+(\d+)/)?.[1]),
    height: Number(output.match(/pixelHeight:\s+(\d+)/)?.[1]),
  };
}

function expectedSizeFor(file) {
  const fileName = file.split('/').at(-1) ?? '';
  return /^(21|22|23|24|25)_/.test(fileName) ? fullHdMobileSize : compactMobileSize;
}

function expectMobileReferences(label, files, expectedCount) {
  if (files.length !== expectedCount) {
    failures.push(`${label} expected ${expectedCount} png references, found ${files.length}`);
  }
  for (const file of files) {
    const { width, height } = dimensions(file);
    const expected = expectedSizeFor(file);
    if (width !== expected.width || height !== expected.height) {
      failures.push(`${file} has ${width}x${height}, expected ${expected.width}x${expected.height}`);
    }
  }
}

const darkFiles = pngFiles(darkDir);
const lightFiles = pngFiles(lightDir);

expectMobileReferences('dark theme', darkFiles, 25);
expectMobileReferences('light theme', lightFiles, 20);

const darkPrefixes = new Set(darkFiles.map((file) => file.split('/').at(-1)?.slice(0, 2)));
for (let index = 1; index <= 25; index += 1) {
  const prefix = String(index).padStart(2, '0');
  if (!darkPrefixes.has(prefix)) failures.push(`dark theme missing numbered screen ${prefix}`);
}

const screenListPath = join(darkDir, 'Список_экранов.txt');
if (!existsSync(screenListPath)) {
  failures.push(`missing screen list: ${screenListPath}`);
} else {
  const listedScreens = readFileSync(screenListPath, 'utf8')
    .split('\n')
    .filter((line) => /^\d{2}_/.test(line));
  if (listedScreens.length < 20) failures.push(`screen list has ${listedScreens.length} entries, expected at least 20`);
}

for (const [prefix, label, route, widgetClass] of designScreens) {
  if (!darkFiles.some((file) => (file.split('/').at(-1) ?? '').startsWith(`${prefix}_`))) {
    failures.push(`dark theme missing design reference for ${prefix} ${label}`);
  }
  if (!webPage.includes(label)) failures.push(`web screen matrix missing label: ${label}`);
  if (!mobileApp.includes(`path: '${route}'`)) failures.push(`mobile routes missing ${route} for ${label}`);
  if (!mobileDesignTest.includes(`${widgetClass}()`)) failures.push(`mobile design render test missing ${widgetClass} for ${label}`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('design source contract ok');
