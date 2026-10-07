import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';

const web = process.env.WEB_BASE_URL;
if (!web) { console.log('Intake E2E skipped: WEB_BASE_URL is not set'); process.exit(0); }
const api = (process.env.API_TEST_ORIGIN || web).replace(/\/$/, '');
const browser = await chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox'] } : {});
const proxyServer = process.env.WEB_TEST_PROXY || (/^https?:\/\/(?!localhost|127\.0\.0\.1)/.test(web) ? process.env.HTTPS_PROXY : undefined);
const context = await browser.newContext({ viewport: { width: 390, height: 845 }, ignoreHTTPSErrors: process.env.WEB_TEST_IGNORE_HTTPS_ERRORS === '1', ...(proxyServer ? {proxy:{server:proxyServer,bypass:'localhost,127.0.0.1'}} : {}) });
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
  await page.evaluate(()=>{window.location.hash='documentUpload';});
  await page.locator('.uploadActions input[accept*="application/pdf"]').setInputFiles({name:'before-confirmation.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4\nSynthetic blocked upload\n%%EOF')});
  await page.evaluate(()=>{window.location.hash='home';});
  await page.locator('.aizanFeedback').filter({hasText:'Сначала опишите ситуацию и подтвердите создание дела'}).waitFor();
  assert.equal((await request('/cases')).length,0);
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
  // Exercise real bytes through the browser and authenticated API; no upload success is mocked.
  const pdf = Buffer.from('%PDF-1.4\n% AIZAN synthetic QA file ' + crypto.randomUUID() + '\n%%EOF');
  await page.locator('.aizanHomeActions input[type=file]').setInputFiles({ name: 'synthetic-qa.pdf', mimeType: 'application/pdf', buffer: pdf });
  await page.getByText('synthetic-qa.pdf: Файл сохранён · требуется проверка', { exact: true }).waitFor();
  const files = await request(`/cases/${cases[0].id}/documents`);
  assert.equal(files.length, 1);
  assert.equal(files[0].sha256, createHash('sha256').update(pdf).digest('hex'));
  const download = await context.request.get(`${api}/api/v1/documents/${files[0].id}/content`, { headers: { 'x-user-id': userId } });
  assert.equal(download.status(), 200);
  assert.deepEqual(await download.body(), pdf);
  const forbidden = await context.request.get(`${api}/api/v1/documents/${files[0].id}/content`, { headers: { 'x-user-id': '00000000-0000-4000-8000-000000000002' } });
  assert.equal(forbidden.status(), 403);
  await page.getByRole('button', { name: 'Подготовить претензию', exact: true }).click();
  await page.getByRole('button', { name: 'Сформировать проект', exact: true }).click();
  await page.locator('.claimPrintBody').waitFor({state:'attached'});
  assert.match(await page.locator('.claimPrintBody').textContent(), /100000 тенге/);
  const generated = await request(`/cases/${cases[0].id}/generated-documents`);
  assert.equal(generated.length, 1);
  const edited=generated[0].body+'\nДополнение пользователя: Қазақстан. Проверено вручную.';
  await request(`/generated-documents/${generated[0].id}`,{body:edited},'PATCH');
  assert.equal((await request(`/generated-documents/${generated[0].id}`)).body,edited);
  const jobs=await request(`/cases/${cases[0].id}/generation-jobs`);
  const generatedJob=jobs.find(job=>job.document?.id===generated[0].id);
  assert(generatedJob);
  assert.equal((await request(`/documents/generation-jobs/${generatedJob.id}`)).document.body,edited);
  const generatedPdf=await context.request.get(`${api}/api/v1/generated-documents/${generated[0].id}/pdf`);
  assert.equal(generatedPdf.status(),200);
  assert.equal((await generatedPdf.body()).subarray(0,5).toString(),'%PDF-');
  const task=await request('/tasks',{title:'Проверить проект',dueDate:'2026-10-20',caseId:cases[0].id});
  assert.equal(task.basis,'user_defined');
  await request(`/tasks/${task.id}`,{status:'completed'},'PATCH');
  assert((await request('/tasks')).some(item=>item.id===task.id && item.status==='completed'));
  await page.evaluate(()=>{window.location.hash='deadlines';});
  await page.getByRole('button',{name:'Обновить',exact:true}).click();
  await page.locator('.deadlineRow').filter({hasText:'Проверить проект'}).waitFor();
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Удалить задачу',exact:true}).click();
  await page.locator('.deadlineRow').filter({hasText:'Проверить проект'}).waitFor({state:'detached'});
  await page.evaluate(()=>{window.location.hash='claimDraft';});
  assert(!(await request('/tasks')).some(item=>item.id===task.id));
  const dispatch=await request(`/generated-documents/${generated[0].id}/dispatches`,{method:'email',contact:'qa@example.invalid',status:'draft'});
  assert.equal(dispatch.status,'draft');
  const manualSend=await request(`/generated-documents/${generated[0].id}/dispatches`,{method:'email',contact:'qa@example.invalid',status:'manual_sent_unverified',confirmed:true});
  assert.equal(manualSend.status,'manual_sent_unverified');
  assert.equal((await request(`/generated-documents/${generated[0].id}/dispatches`)).length,2);
  const ticket=await request('/support/tickets',{topic:'QA',text:'Синтетическое обращение для проверки сохранения'});
  assert((await request('/support/tickets')).some(item=>item.id===ticket.id && !item.reply));
  const exported=await request('/account/export');
  assert(exported.data.cases.some(item=>item.id===cases[0].id));
  assert(exported.data.drafts.some(item=>item.id===generated[0].id && item.body===edited));
  assert(exported.data.supportTickets.some(item=>item.payload.id===ticket.id));
  const replayKey=crypto.randomUUID();
  const replayBody={role:'user',text:'Проверка повторного запроса'};
  const replayUrl=`${api}/api/v1/cases/${cases[0].id}/messages`;
  for(let n=0;n<2;n++) assert((await context.request.post(replayUrl,{data:replayBody,headers:{'idempotency-key':replayKey}})).ok());
  assert.equal((await request(`/cases/${cases[0].id}/messages`)).filter(item=>item.text===replayBody.text).length,1);
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
  const manual = await request('/ai/classifications', {text:'Хочу развестись'});
  await request(`/ai/classifications/${manual.id}/override`, {subcategoryCode:'civil.debt.loan',reason:'Проверка сохранения ручного выбора'});
  const manualReload = await request(`/ai/classifications/${manual.id}`);
  assert.equal(manualReload.result.category_code, 'civil.debt');
  assert.equal(manualReload.result.subcategory_code, 'civil.debt.loan');
  assert.equal(manualReload.result.confidence, 1);
  assert.deepEqual(manualReload.result.missing_facts, ['loan_date','amount','debtor_identity']);
  const forged = await context.request.get(`${api}/api/v1/admin/documents/review-queue`, { headers: { 'x-user-role': 'admin' } });
  if (process.env.WEB_TEST_SECURE_AUTH === '1') assert.equal(forged.status(), 403);
  assert.equal(jsErrors.length, 0, jsErrors.join('\n'));
  console.log('Real API draft edits/PDF/tasks/manual dispatch/support/account export/message replay and intake E2E passed: one initial classification, sequential saved answers, outage/retry without duplicate messages, reload, confirmed case/facts, contextual legal answer, generated draft and reopening a saved case with its own facts/documents/history.');
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
