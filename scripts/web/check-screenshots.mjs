import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const outDir = 'docs/project/web-visual-baselines';
const targets = [
  { name: 'mobile-390-dark', width: 390, height: 844, hash: '#home', theme: 'dark' },
  { name: 'mobile-430-light', width: 430, height: 932, hash: '#home', theme: 'light' },
  { name: 'desktop-1440-dark', width: 1440, height: 900, hash: '#home', theme: 'dark' },
  { name: 'desktop-1440-light', width: 1440, height: 900, hash: '#home', theme: 'light' },
];

async function main() {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    console.log('web screenshot baseline skipped: playwright is not installed');
    return;
  }

  const baseUrl = process.env.WEB_BASE_URL;
  if (!baseUrl) {
    console.log('web screenshot baseline skipped: WEB_BASE_URL is not set');
    return;
  }

  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const target of targets) {
      const page = await browser.newPage({ viewport: { width: target.width, height: target.height } });
      await page.goto(`${baseUrl}${target.hash}`, { waitUntil: 'networkidle' });
      const currentTheme = await page.locator('.appShell').getAttribute('data-theme');
      if (currentTheme !== target.theme) {
        await page.locator('.appStatus button').last().click();
      }
      await page.screenshot({ path: join(outDir, `${target.name}.png`), fullPage: false });
      await page.close();
    }
  } finally {
    await browser.close();
  }

  console.log(`web screenshot baselines written: ${outDir}`);
}

await main();
