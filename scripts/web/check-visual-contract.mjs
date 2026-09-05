import { readFileSync } from 'node:fs';

const page = readFileSync('apps/web/app/page.tsx', 'utf8');
const css = readFileSync('apps/web/app/styles.css', 'utf8');
const failures = [];

const requiredPageNeedles = [
  'data-theme={theme}',
  'data-design-screen-count={screens.length}',
  '<aside className="sidebar"',
  '<aside className="rightPanel"',
  '<nav className="bottomNav"',
  'aria-label="Навигация ПК"',
  'aria-label="Контекст дела"',
  'setTheme(theme === "dark" ? "light" : "dark")',
];

const requiredCssNeedles = [
  '--bg: #06111d',
  '--panel: #0d1a28',
  '--panel-soft: #101f2f',
  '--text: #f8f4ec',
  '--muted: #a9b0ba',
  '--gold: #e6bd62',
  '--gold-strong: #ffd979',
  '.appShell[data-theme="light"]',
  '--bg: #fbf7ef',
  '--panel: #ffffff',
  '--text: #20272c',
  '--gold: #d8a13a',
  'grid-template-columns: minmax(220px, 280px) minmax(420px, 620px) minmax(280px, 360px)',
  'max-width: 620px',
  'border-radius: 34px',
  '@media (max-width: 980px)',
  'grid-template-columns: minmax(190px, 240px) minmax(420px, 620px)',
  '.rightPanel { display: none; }',
  '@media (max-width: 620px)',
  'grid-template-columns: minmax(0, 1fr)',
  '.sidebar, .rightPanel { display: none; }',
  'position: fixed',
  'bottom: 0',
  'grid-template-columns: repeat(5, 1fr)',
  'max(12px, env(safe-area-inset-bottom))',
  'min-height: calc(100vh - 44px)',
  'white-space: nowrap',
  'text-overflow: ellipsis',
];

for (const needle of requiredPageNeedles) {
  if (!page.includes(needle)) failures.push(`web visual page contract missing: ${needle}`);
}

for (const needle of requiredCssNeedles) {
  if (!css.includes(needle)) failures.push(`web visual css contract missing: ${needle}`);
}

if (!/\.appShell\s*\{[\s\S]*?grid-template-columns:\s*minmax\(220px,\s*280px\)\s*minmax\(420px,\s*620px\)\s*minmax\(280px,\s*360px\)/.test(css)) {
  failures.push('desktop layout must use left/center/right grid, not stretched mobile only');
}

if (!/@media \(max-width: 980px\)\s*\{[\s\S]*?\.sidebar,\s*\.rightPanel\s*\{\s*display:\s*none;\s*\}/.test(css)) {
  failures.push('tablet/mobile layout must hide desktop side panels');
}

if (!/\.bottomNav\s*\{[\s\S]*?display:\s*grid[\s\S]*?grid-template-columns:\s*repeat\(5,\s*1fr\)/.test(css)) {
  failures.push('mobile layout must expose five-tab bottom navigation');
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('web visual contract ok');
