import { readFileSync } from 'node:fs';

const page = readFileSync('apps/admin/app/page.tsx', 'utf8');
const css = readFileSync('apps/admin/app/styles.css', 'utf8');
const tokens = readFileSync('apps/admin/src/design-system/tokens.ts', 'utf8');
const apiPaths = readFileSync('apps/admin/src/api/api-paths.ts', 'utf8');

const failures = [];

const requiredPageText = [
  'Панель контроля качества и бюджета',
  'Юридический guardrail',
  'Identity наблюдаемость',
  'Case/chat/voice',
  'Documents/evidence',
  'Legal RAG',
  'Templates',
  'Budget operations',
  'официальным источникам РК',
  'без raw PII',
  'Загрузить audit events',
  'Переключить provider kill switch',
  'Импортировать legal source',
  'Обновить AI usage',
  'Audit events:',
  'Provider stub:',
  'Legal source imported:',
  'AI usage summary:',
  'Обращения поддержки',
  '/admin/overview',
];

for (const text of requiredPageText) {
  if (!page.includes(text)) failures.push(`admin page missing text: ${text}`);
}

const requiredPaths = [
  '/auth/register',
  '/cases',
  '/files/upload-sessions',
  '/legal-search',
  '/legal-sources/manual-import',
  '/documents/generate',
  '/usage/ai',
  '/admin/providers',
  '/admin/audit-events',
];

for (const path of requiredPaths) {
  if (!apiPaths.includes(path)) failures.push(`admin api paths missing: ${path}`);
}

const tokenPairs = [
  ['light background', "--bg: #fbf7ef", "background: '#fbf7ef'"],
  ['light surface', "--surface: #ffffff", "surface: '#ffffff'"],
  ['light text', "--text: #20272c", "text: '#20272c'"],
  ['light accent', "--gold: #d8a13a", "accent: '#d8a13a'"],
  ['dark background', "--bg: #071421", "background: '#071421'"],
  ['dark surface', "--surface: #101d2a", "surface: '#101d2a'"],
  ['dark text', "--text: #f8f4ec", "text: '#f8f4ec'"],
  ['dark muted', "--muted: #aeb7c0", "muted: '#aeb7c0'"],
];

for (const [label, cssNeedle, tokenNeedle] of tokenPairs) {
  if (!css.includes(cssNeedle)) failures.push(`admin css missing ${label}: ${cssNeedle}`);
  if (!tokens.includes(tokenNeedle)) failures.push(`admin tokens missing ${label}: ${tokenNeedle}`);
}

if (!/@media \(prefers-color-scheme: dark\)/.test(css)) failures.push('admin css missing dark theme media query');
if (!/JSON\.stringify\(tokens\.light/.test(page)) failures.push('admin page missing visible token dump for QA');
for (const requiredAction of ['loadAuditEvents', 'toggleStubProvider', 'importLegalSource', 'loadAiUsageSummary', "fetch(`/api/v1${path}`"]) {
  if (!page.includes(requiredAction)) failures.push(`admin page missing live action: ${requiredAction}`);
}
if (!apiPaths.includes('/admin/audit-events') || !apiPaths.includes('/admin/providers')) failures.push('admin generated paths missing RBAC endpoints');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('admin ui contract ok');
