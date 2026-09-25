import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const failures = [];
const mobileApp = readFileSync('apps/mobile/lib/main.dart', 'utf8');
const mobileTheme = readFileSync('apps/mobile/lib/src/theme/app_theme.dart', 'utf8');
const mobileAuth = readFileSync('apps/mobile/lib/src/features/auth/auth_screens.dart', 'utf8');
const mobileCases = readFileSync('apps/mobile/lib/src/features/cases/case_screens.dart', 'utf8');
const mobileDocuments = readFileSync('apps/mobile/lib/src/features/documents/document_screens.dart', 'utf8');
const mobileWorkflows = readFileSync('apps/mobile/lib/src/features/workflows/workflow_screens.dart', 'utf8');
const mobileLegal = readFileSync('apps/mobile/lib/src/features/legal/legal_screens.dart', 'utf8');
const mobileSubscription = readFileSync('apps/mobile/lib/src/features/subscription/subscription_screen.dart', 'utf8');
const mobileDesignTest = readFileSync('apps/mobile/test/design_golden_test.dart', 'utf8');
const webPage = readFileSync('apps/web/app/page.tsx', 'utf8');
const webCss = readFileSync('apps/web/app/styles.css', 'utf8');
const adminCss = readFileSync('apps/admin/app/styles.css', 'utf8');
const adminTokens = readFileSync('apps/admin/src/design-system/tokens.ts', 'utf8');
const parityMatrixPath = 'docs/project/DESIGN_PARITY_MATRIX.md';
const parityMatrix = existsSync(parityMatrixPath) ? readFileSync(parityMatrixPath, 'utf8') : '';
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
  if (!parityMatrix.includes(`| ${prefix} |`) || !parityMatrix.includes(label)) {
    failures.push(`design parity matrix missing ${prefix} ${label}`);
  }
}

const tokenNeedles = [
  ['web dark background', webCss, '--bg: #06111d'],
  ['web dark panel', webCss, '--panel: #0d1a28'],
  ['web light background', webCss, '--bg: #fbf7ef'],
  ['web light panel', webCss, '--panel: #ffffff'],
  ['web gold', webCss, '--gold: #d8a13a'],
  ['web mobile breakpoint', webCss, '@media (max-width: 620px)'],
  ['mobile light background', mobileTheme, '0xFFFBF7EF'],
  ['mobile dark background', mobileTheme, '0xFF071421'],
  ['mobile gold', mobileTheme, '0xFFD8A13A'],
  ['mobile card radius', mobileTheme, 'Radius.circular(20)'],
  ['mobile control radius', mobileTheme, 'Radius.circular(18)'],
  ['admin light background', adminCss, '--bg: #fbf7ef'],
  ['admin dark background', adminCss, '--bg: #071421'],
  ['admin dark media', adminCss, '@media (prefers-color-scheme: dark)'],
  ['admin token light', adminTokens, "background: '#fbf7ef'"],
  ['admin token dark', adminTokens, "background: '#071421'"],
  ['matrix action contract', parityMatrix, '## Action Contract'],
  ['matrix no fake government', parityMatrix, 'fake government/payment/SMS production behavior'],
  ['web auth emblem', webCss, '.authMark'],
  ['web auth divider', webCss, '.goldDivider'],
  ['web auth action row', webCss, '.authActionRow'],
  ['web otp boxes', webCss, '.otpBoxes'],
  ['mobile auth emblem', mobileAuth, '_AuthEmblem'],
  ['mobile auth divider', mobileAuth, '_AuthDivider'],
  ['web category hero', webCss, '.categoryHero'],
  ['web category alternatives', webCss, '.categoryAlternatives'],
  ['mobile category interview progress', mobileCases, '_AiInterviewProgress'],
  ['mobile category interview chat', mobileCases, '_AiInterviewChat'],
  ['mobile category confidence', mobileCases, 'Уверенность:'],
  ['web document readiness', webCss, '.docReadinessCard'],
  ['web document checklist', webCss, '.docChecklist'],
  ['web upload hero', webCss, '.uploadHero'],
  ['web analysis timeline', webCss, '.analysisTimeline'],
  ['mobile document readiness', mobileDocuments, '_ReadinessCard'],
  ['mobile upload options', mobileDocuments, '_UploadOptionGrid'],
  ['mobile analysis timeline', mobileDocuments, '_AnalysisTimeline'],
  ['mobile document 68 percent', mobileDocuments, 'Готовность дела: 68%'],
  ['mobile document 82 percent', mobileDocuments, '82%'],
  ['web claim build hero', webCss, '.claimBuildHero'],
  ['web claim paper', webCss, '.claimPaper'],
  ['web send methods', webCss, '.sendMethods'],
  ['mobile claim build hero', mobileWorkflows, '_ClaimBuildHero'],
  ['mobile claim steps', mobileWorkflows, '_ClaimSteps'],
  ['mobile claim status chips', mobileWorkflows, '_ClaimStatusChips'],
  ['mobile send method grid', mobileWorkflows, '_SendMethodGrid'],
  ['mobile claim progress', mobileWorkflows, 'Прогресс подготовки'],
  ['web case filters', webCss, '.caseFilters'],
  ['web case detail hero', webCss, '.caseDetailHero'],
  ['web case progress rail', webCss, '.caseProgressRail'],
  ['web chat case card', webCss, '.chatCaseCard'],
  ['web case calendar', webCss, '.caseCalendar'],
  ['mobile reference case list', mobileCases, '_ReferenceCaseListTile'],
  ['mobile case detail hero', mobileCases, '_CaseDetailHero'],
  ['mobile chat document button', mobileCases, 'Сформировать документ'],
  ['mobile reference calendar', mobileLegal, '_ReferenceCalendar'],
  ['mobile deadlines auto card', mobileLegal, 'Сроки рассчитываются автоматически'],
  ['web popular queries', webCss, '.popularQueries'],
  ['web profile hero', webCss, '.profileHero'],
  ['web settings group', webCss, '.settingsGroup'],
  ['web subscription hero', webCss, '.subscriptionHero'],
  ['web help grid', webCss, '.helpGrid'],
  ['mobile legal popular query', mobileLegal, 'взыскание алиментов'],
  ['mobile profile hero', mobileAuth, '_ProfileHero'],
  ['mobile profile completion', mobileAuth, '_ProfileCompletionCard'],
  ['mobile settings group', mobileAuth, '_SettingsGroup'],
  ['mobile help quick grid', mobileAuth, '_HelpQuickGrid'],
  ['mobile subscription plan card', mobileSubscription, '_PlanCard'],
  ['mobile subscription usage', mobileSubscription, '_UsageCard'],
];

for (const [label, haystack, needle] of tokenNeedles) {
  if (!haystack.includes(needle)) failures.push(`design token gate missing ${label}: ${needle}`);
}

const actionTypes = ['API call', 'Route transition', 'Local persisted state', 'File picker/upload', 'Microphone recording/STT', 'Dialog/blocker'];
for (const actionType of actionTypes) {
  if (!parityMatrix.includes(actionType)) failures.push(`design action contract missing type: ${actionType}`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('design source contract ok');
