import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.WEB_BASE_URL?.replace(/\/$/, '');
if (!base) throw new Error('WEB_BASE_URL_REQUIRED');
const browser = await chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, args:['--no-sandbox']} : {});
const proxy = /^https?:\/\/(?!localhost|127\.0\.0\.1)/.test(base) ? process.env.HTTPS_PROXY : undefined;
const context = await browser.newContext({viewport:{width:390,height:844}, ...(proxy ? {proxy:{server:proxy,bypass:'localhost,127.0.0.1'}} : {})});
let userId;
async function request(path, data, method=data ? 'POST' : 'GET') {
  const response = await context.request.fetch(`${base}/api/v1${path}`,{method,data,timeout:180000});
  assert(response.ok(),`${path}: ${response.status()}`);
  return response.json();
}
try {
  const health=await request('/health');
  assert.equal(health.aiConversationEnabled,true,'OpenAI must actually be configured for this live check');
  const otp=await request('/auth/register',{channel:'email',email:`openai-qa-${crypto.randomUUID()}@example.invalid`,consentVersion:'v1'});
  assert.equal(otp.deliveryMode,'stub','Do not send real email/SMS for QA');
  const auth=await request('/auth/otp/verify',{otpId:otp.otpId,code:otp.testCode});
  userId=auth.user.id;
  await request('/profiles',{userId,type:'person',displayName:'Синтетический тест AIZAN'});
  const page=await context.newPage();
  page.setDefaultTimeout(180000);
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base);
  await page.evaluate(id=>{
    localStorage.setItem('aizan-chat-mode','ai');
    localStorage.setItem('ai-lawyer-web-state',JSON.stringify({view:'home',authUserId:id,profileComplete:true,profileName:'Синтетический тест AIZAN',theme:'dark',cases:[],documents:[]}));
  },userId);
  await page.goto(`${base}/#home`);
  await page.getByRole('button',{name:'Работать без OpenAI',exact:true}).waitFor();
  await page.getByRole('button',{name:'Ввести текст',exact:true}).click();
  const input=page.locator('#home-problem');
  async function send(text) {
    const completed=page.waitForResponse(response=>response.url().includes('/messages')&&response.request().method()==='POST',{timeout:180000});
    await input.fill(text);
    await page.getByRole('button',{name:'Отправить',exact:true}).click();
    const response=await completed;
    assert(response.ok(),`Real OpenAI chat request: ${response.status()}`);
    await page.waitForFunction(()=>document.querySelector('#home-problem')?.value==='',{timeout:180000});
    assert.equal(await page.locator('.appShell').getAttribute('data-view'),'home');
    const cases=await request('/cases');
    assert.equal(cases.length,1);
    const history=await request(`/cases/${cases[0].id}/messages`);
    const assistant=history.filter(message=>message.role==='assistant').at(-1);
    assert.equal(assistant.ai?.provider,'openai');
    return {assistant,caseId:cases[0].id,history};
  }
  const first=await send('Это синтетическая проверка интерфейса, без реальных участников. Хочу подготовить претензию: дал в долг 100000 тенге по расписке, должник не вернул деньги. Помогите уточнить данные.');
  assert(first.assistant.ai.missingFields.length>0);
  assert.equal(first.assistant.ai.readyForDraft,false);
  const summary=await send('Для этого синтетического проекта: заявитель Тестовый Заявитель, адрес Алматы, улица Тестовая 1, e-mail claimant@example.invalid. Получатель Тестовый Должник, адрес Алматы, улица Тестовая 2, e-mail debtor@example.invalid. Заём 100000 тенге передан 12 января 2026 года, возврат по расписке был предусмотрен 12 февраля 2026 года, денег не вернули. Требую вернуть только основной долг 100000 тенге, без процентов и неустойки. Доказательство: подписанная расписка, приложу её вручную. Срок добровольного исполнения выбираю до 1 ноября 2026 года, прошу ответить на e-mail заявителя. Покажите резюме всех реквизитов и требований для подтверждения.');
  assert.deepEqual(summary.assistant.ai.missingFields,[],'The actual model must retain all supplied facts');
  assert.equal(summary.assistant.ai.readyForDraft,false);
  const final=await send('Подтверждаю. Все реквизиты, даты и требования в резюме верны. Подготовьте полный проект досудебной претензии по действующим нормам Республики Казахстан с проверенными официальными источниками.');
  assert.equal(final.assistant.ai.readyForDraft,true,'Must produce an actual source-backed draft, not a stub');
  assert(final.assistant.ai.citations.every(source=>source.checkedAt&&/^https:\/\/(?:[^/]+\.)?(?:adilet\.zan\.kz|zan\.gov\.kz|sud\.gov\.kz|gov\.kz)\//.test(source.url)));
  assert(final.assistant.ai.draftBody.includes('100000')||final.assistant.ai.draftBody.includes('100 000'));
  await page.reload();
  await page.getByRole('button',{name:'Сохранить претензию как документ',exact:true}).click();
  await page.locator('.aizanInlineDraft textarea').waitFor();
  assert.equal(await page.locator('.appShell').getAttribute('data-view'),'home');
  const docs=await request(`/cases/${final.caseId}/generated-documents`);
  assert.equal(docs.length,1);
  assert(docs[0].body.includes(final.assistant.ai.draftBody));
  const pdf=await context.request.get(`${base}/api/v1/generated-documents/${docs[0].id}/pdf`);
  assert(pdf.ok());
  assert.equal((await pdf.body()).subarray(0,4).toString(),'%PDF');
  assert.deepEqual(errors,[]);
  console.log('Live OpenAI E2E passed: real clarification, retained facts, confirmed official-source draft, reload, inline document and real PDF.');
} finally {
  try { if(userId) await request('/account',undefined,'DELETE'); }
  finally { await context.close(); await browser.close(); }
}
