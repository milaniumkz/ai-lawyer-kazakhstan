import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const web = process.env.WEB_BASE_URL;
if (!web) { console.log('Intake E2E skipped: WEB_BASE_URL is not set'); process.exit(0); }
const api = (process.env.API_TEST_ORIGIN || web).replace(/\/$/, '');
const browser = await chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox'] } : {});
const context = await browser.newContext({ viewport: { width: 390, height: 845 }, ignoreHTTPSErrors: process.env.WEB_TEST_IGNORE_HTTPS_ERRORS === '1' });
let userId;
let page;
async function request(path, data, method = data ? 'POST' : 'GET') {
  const response = await context.request.fetch(`${api}/api/v1${path}`, { method, data, headers: userId ? { 'x-user-id': userId } : {}, timeout: 30000 });
  assert(response.ok(), `${method} ${path}: ${response.status()} ${await response.text()}`);
  return response.json();
}
try {
  // Auth currently uses its explicit stub mode. Never silently depend on a real SMS/email delivery.
  const otp = await request('/auth/register', { channel: 'email', email: `intake-qa-${crypto.randomUUID()}@example.invalid`, consentVersion: 'v1' });
  assert.equal(otp.deliveryMode, 'stub');
  const auth = await request('/auth/otp/verify', { otpId: otp.otpId, code: otp.testCode });
  userId = auth.user.id;
  await request('/profiles', { userId, type: 'person', displayName: 'Тестовый пользователь AIZAN' });
  page = await context.newPage();
  const jsErrors = [];
  page.on('pageerror', error => jsErrors.push(error.message));
  let classifications = 0;
  let clarifications = 0;
  let failNext = false;
  await page.route('**/api/v1/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/v1/ai/classifications' && route.request().method() === 'POST') classifications++;
    if (path.endsWith('/clarifications')) {
      clarifications++;
      if (failNext) { failNext = false; return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'Temporary test outage' }) }); }
    }
    // A local test may forward to an isolated real API instance. No successful API response is mocked.
    const response = await route.fetch({ url: `${api}${path}${new URL(route.request().url()).search}` });
    return route.fulfill({ response });
  });
  await page.goto(web);
  await page.waitForFunction(() => localStorage.getItem("ai-lawyer-web-state"));
  await page.evaluate(id => localStorage.setItem('ai-lawyer-web-state', JSON.stringify({ view: 'home', authUserId: id, profileComplete: true, profileName: 'Тестовый пользователь AIZAN', theme: 'dark', cases: [], documents: [] })), userId);
  await page.goto(`${web.replace(/\/$/, '')}/?intake=qa#home`);
  await page.getByRole('button', { name: 'Ввести текст', exact: true }).click();
  const input = page.locator('#home-problem');
  await input.fill('Работодатель не выплатил зарплату');
  // Two submits in one event turn must issue exactly one request.
  await page.locator('.aizanHomeComposer').evaluate(form => { form.requestSubmit(); form.requestSubmit(); });
  await page.locator('.aizanHomeMessage.assistant').filter({ hasText: 'За какой период не выплачена зарплата?' }).waitFor();
  assert.equal(classifications, 1);
  assert.equal(await input.inputValue(), '');
  failNext = true;
  await input.fill('Январь и февраль 2026');
  await page.getByRole('button', { name: 'Отправить', exact: true }).click();
  await page.locator('.aizanFeedback').filter({ hasText: 'Текст сохранён' }).waitFor();
  assert.equal(await input.inputValue(), 'Январь и февраль 2026');
  assert.equal(await page.locator('.aizanHomeMessage.user').count(), 1);
  await page.getByRole('button', { name: 'Отправить', exact: true }).click();
  await page.locator('.aizanHomeMessage.assistant').filter({ hasText: 'Какова сумма требования в тенге?' }).waitFor();
  assert.equal(classifications, 1);
  assert.equal(clarifications, 2); // one failed, one retry
  await page.reload();
  await input.waitFor();
  assert.equal(await input.inputValue(), '');
  assert.equal(await page.locator('.aizanHomeMessage.user').count(), 2);
  await input.fill('100000 тенге');
  await page.getByRole('button', { name: 'Отправить', exact: true }).click();
  await page.getByRole('button', { name: 'Подтвердить и создать дело', exact: true }).waitFor({ state: 'visible' });
  await page.waitForFunction(() => !document.querySelector('.aizanIntakeSteps .primary')?.disabled);
  assert.equal(classifications, 1);
  assert.equal(clarifications, 3);
  assert.equal(await page.locator('.appShell').getAttribute('data-view'), 'home');
  await page.getByRole('button', { name: 'Подтвердить и создать дело', exact: true }).click();
  await page.getByRole('button', { name: 'Подготовить претензию', exact: true }).waitFor();
  const cases = await request('/cases');
  assert.equal(cases.length, 1);
  assert.equal(cases[0].subcategory, 'labor.wage_arrears');
  const saved = await request(`/cases/${cases[0].id}/classification`);
  assert.equal(saved.userConfirmed, true);
  assert.deepEqual(saved.result.missing_facts, []);
  assert.equal(saved.result.facts.employment_period, 'Январь и февраль 2026');
  assert.equal(saved.result.facts.amount, '100000 тенге');
  // Short follow-up messages must reach the legal answer path, not restart classification.
  await input.fill('Что дальше?');
  await page.getByRole('button', { name: 'Отправить', exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll('.aizanHomeMessage.user').length === 4);
  assert.equal(classifications, 1);
  const messages = await request(`/cases/${cases[0].id}/messages`);
  assert(messages.some(message => message.role === 'assistant' && /источник|юридич|подтвержд/i.test(message.text)));
  assert.equal(await page.locator('.appShell').getAttribute('data-view'), 'home');
  await page.getByRole('button', { name: 'Подготовить претензию', exact: true }).click();
  await page.getByRole('button', { name: 'Сформировать проект', exact: true }).click();
  await page.locator('.claimPrintBody').waitFor({state:'attached'});
  assert.match(await page.locator('.claimPrintBody').textContent(), /100000 тенге/);
  const generated = await request(`/cases/${cases[0].id}/generated-documents`);
  assert.equal(generated.length, 1);
  await page.reload();
  await page.locator('.claimPrintBody').waitFor({state:'attached'});
  assert.match(await page.locator('.claimPrintBody').textContent(), /100000 тенге/);
  await page.getByRole('button', {name:'Назад', exact:true}).first().click();
  await page.getByRole('button', {name:'Новое дело', exact:true}).click();
  await page.locator('.bottomNav').getByRole('button', {name:'Мои дела', exact:true}).click();
  await page.locator('.caseRow').filter({hasText:'Работодатель не выплатил зарплату'}).click();
  await page.waitForFunction(() => document.querySelector('.appShell')?.dataset.view === 'case');
  await page.locator('.bottomNav').getByRole('button', {name:'Главная', exact:true}).click();
  await page.getByRole('button', {name:'Подготовить претензию', exact:true}).waitFor();
  const restored = await page.evaluate(() => JSON.parse(localStorage.getItem('ai-lawyer-web-state')));
  assert.equal(restored.remoteCaseId, cases[0].id);
  assert.equal(restored.classification.result.facts.amount, '100000 тенге');
  assert.match(restored.generatedClaimBody, /100000 тенге/);
  assert.equal(jsErrors.length, 0, jsErrors.join('\n'));
  console.log('Real API intake E2E passed: one initial classification, sequential saved answers, outage/retry without duplicate messages, reload, confirmed case/facts, contextual legal answer, generated draft and reopening a saved case with its own facts/documents/history.');
} catch (error) {
  if (page) {
    console.error('Intake failure:', await page.locator('.appShell').getAttribute('data-view'), await page.locator('.aizanFeedback').allTextContents());
    await page.screenshot({path:'/tmp/aizan-intake-failure.png',fullPage:true});
  }
  throw error;
} finally {
  if (userId) await request('/account', undefined, 'DELETE');
  await browser.close();
}
