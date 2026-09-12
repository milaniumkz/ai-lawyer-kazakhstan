import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const outDir = 'docs/project/web-visual-baselines';
const strict = process.env.WEB_SCREENSHOT_STRICT === '1';
const viewports = [
  { name: 'mobile-ref-390', width: 390, height: 693 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-430', width: 430, height: 932 },
  { name: 'desktop-1440', width: 1440, height: 900 },
];
const screens = [
  ['01', 'onboarding'],
  ['02', 'login'],
  ['03', 'register'],
  ['04', 'otp'],
  ['05', 'biometric'],
  ['06', 'home'],
  ['07', 'newCase'],
  ['08', 'category'],
  ['09', 'documentCheck'],
  ['10', 'documentUpload'],
  ['11', 'analysis'],
  ['12', 'claim'],
  ['13', 'claimDraft'],
  ['14', 'claimSend'],
  ['15', 'cases'],
  ['16', 'case'],
  ['17', 'chat'],
  ['18', 'deadlines'],
  ['19', 'legal'],
  ['20', 'legalSearch'],
  ['21', 'documents'],
  ['22', 'profile'],
  ['23', 'settings'],
  ['24', 'subscription'],
  ['25', 'help'],
];
const themes = ['dark', 'light'];
const publicViews = new Set(['onboarding', 'login', 'otp', 'register']);
const targets = screens.flatMap(([index, view]) =>
  themes
    .filter((theme) => theme === 'dark' || Number(index) <= 20)
    .flatMap((theme) =>
      viewports.map((viewport) => ({
        ...viewport,
        theme,
        hash: `#${view}`,
        name: `${viewport.name}-${theme}-${index}-${view}`,
      })),
    ),
);

function skipOrFail(message) {
  if (strict) {
    console.error(message);
    process.exit(1);
  }
  console.log(message);
}

async function main() {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    skipOrFail('web screenshot baseline skipped: playwright is not installed');
    return;
  }

  const baseUrl = process.env.WEB_BASE_URL;
  if (!baseUrl) {
    skipOrFail('web screenshot baseline skipped: WEB_BASE_URL is not set');
    return;
  }

  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const target of targets) {
      const page = await browser.newPage({ viewport: { width: target.width, height: target.height } });
      await page.addInitScript(({ theme, view, isPublic }) => {
        window.localStorage.clear();
        window.localStorage.setItem(
          'ai-lawyer-web-state',
          JSON.stringify({
            theme,
            view,
            language: 'RU',
            authUserId: isPublic ? '' : '00000000-0000-4000-8000-000000000001',
            profileComplete: !isPublic,
            firstName: 'Дмитрий',
            lastName: 'Штрахов',
            city: 'Астана',
            profileName: 'Дмитрий Штрахов',
          }),
        );
      }, { theme: target.theme, view: target.hash.slice(1), isPublic: publicViews.has(target.hash.slice(1)) });
      await page.goto(`${baseUrl.replace(/\/$/, '')}${target.hash}`, { waitUntil: 'networkidle' });
      await page.locator('.appShell').waitFor({ state: 'visible' });
      await page.waitForFunction((theme) => document.querySelector('.appShell')?.getAttribute('data-theme') === theme, target.theme, { timeout: 5000 }).catch(() => {});
      const currentTheme = await page.locator('.appShell').getAttribute('data-theme');
      if (currentTheme !== target.theme) {
        const switcher = page.locator('.appStatus button').last();
        if (await switcher.isVisible()) {
          await switcher.click();
          await page.locator(`.appShell[data-theme="${target.theme}"]`).waitFor({ state: 'visible' });
        } else {
          throw new Error(`theme ${target.theme} was not applied for ${target.name}`);
        }
      }
      await page.screenshot({ path: join(outDir, `${target.name}.png`), fullPage: false });
      await page.close();
    }
  } finally {
    await browser.close();
  }

  console.log(`web screenshot baselines written: ${targets.length} files in ${outDir}`);
}

await main();
