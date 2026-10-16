import assert from 'node:assert/strict';
import sharp from 'sharp';
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
  await page.addInitScript(id=>{
    if (localStorage.getItem('aizan-openai-qa-user') !== id) {
      localStorage.setItem('aizan-openai-qa-user',id);
      localStorage.setItem('aizan-chat-mode','ai');
      localStorage.setItem('ai-lawyer-web-state',JSON.stringify({view:'home',authUserId:id,profileComplete:true,profileName:'Синтетический тест AIZAN',theme:'dark',cases:[],documents:[]}));
    }
  },userId);
  await page.goto(`${base}/?openai=qa#home`);
  await page.getByRole('button',{name:'Пошаговое заполнение',exact:true}).waitFor();
  await page.getByRole('button',{name:'Ввести текст',exact:true}).click();
  const input=page.locator('#home-problem');
  async function send(text, attempt=0) {
    const completed=page.waitForResponse(response=>response.url().includes('/messages')&&response.request().method()==='POST',{timeout:180000});
    await input.fill(text);
    await page.getByRole('button',{name:'Отправить',exact:true}).click();
    const response=await completed;
    if (!response.ok()) {
      const error = await response.json();
      if (response.status()===503 && (error.error?.code || error.code)==='OPENAI_TIMEOUT' && attempt===0) {
        await page.waitForFunction(()=>!document.querySelector('.aizanComposerSend')?.disabled);
        assert.equal(await input.inputValue(),text,'Failed request must retain the original text');
        console.log('Transient OpenAI timeout: retrying once with the preserved message');
        return send(text,1);
      }
      throw new Error(`Real OpenAI chat request: ${response.status()} ${error.error?.code || error.code || 'UNKNOWN_ERROR'}`);
    }
    await page.waitForFunction(()=>document.querySelector('#home-problem')?.value==='' && !document.querySelector('.aizanTyping'),{timeout:180000});
    assert.equal(await page.locator('.appShell').getAttribute('data-view'),'home');
    const cases=await request('/cases');
    assert.equal(cases.length,1);
    const history=await request(`/cases/${cases[0].id}/messages`);
    const assistant=history.filter(message=>message.role==='assistant').at(-1);
    assert.equal(assistant.ai?.provider,'openai');
    return {assistant,caseId:cases[0].id,history};
  }
  const first=await send('Это синтетическая проверка интерфейса, без реальных участников. Хочу подготовить претензию: дал в долг 100000 тенге по расписке, должник не вернул деньги. Помогите уточнить данные.');
  console.log('Live OpenAI first clarification received');
  assert(first.assistant.ai.missingFields.length>0);
  assert.equal(first.assistant.ai.readyForDraft,false);
  // A random code appears only in image bytes; no real customer data is used.
  const imageCode='VQA-'+crypto.randomUUID().slice(0,8).toUpperCase();
  const image=await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="600"><rect width="100%" height="100%" fill="white"/><text x="60" y="110" font-family="sans-serif" font-size="54" fill="black">SYNTHETIC DOCUMENT TEST</text><text x="60" y="230" font-family="sans-serif" font-size="54" fill="black">Amount: 100000 KZT</text><text x="60" y="380" font-family="sans-serif" font-size="70" fill="black">Visual code: ${imageCode}</text></svg>`)).png().toBuffer();
  await page.locator('.bottomNav input[type=file]').setInputFiles({name:'photo-qa.png',mimeType:'image/png',buffer:image});
  await page.getByText('Готов к отправке',{exact:true}).waitFor();
  await page.locator('.aizanPendingAttachment .aizanAttachmentPreview').waitFor();
  const photo=await send('Это синтетическая проверка чтения изображения, не новое обстоятельство дела. Прочитайте и напишите точный код после Visual code на прикреплённом фото, а затем продолжим уточнения. Не угадывайте код.');
  assert(photo.assistant.text.includes(imageCode),'OpenAI must read a random code from the photo, absent from the text prompt');
  assert.equal(photo.history.filter(message=>message.role==='user').at(-1).attachments[0].fileName,'photo-qa.png');
  assert.equal(await page.locator('.aizanPendingAttachment').count(),0);
  await page.reload();await page.getByRole('button',{name:'Пошаговое заполнение',exact:true}).waitFor();
  assert(await page.locator('.aizanHomeMessages .aizanChatAttachment').count()>=1,'Attachment card survives reload');
  console.log('Live OpenAI photo reading passed: actual uploaded image, random code absent from prompt, thumbnail, card and reload.');
  const summary=await send('Для этого синтетического проекта: заявитель Тестовый Заявитель, адрес Алматы, улица Тестовая 1, e-mail claimant@example.invalid. Получатель Тестовый Должник, адрес Алматы, улица Тестовая 2, e-mail debtor@example.invalid. Заём 100000 тенге передан 12 января 2026 года, возврат по расписке был предусмотрен 12 февраля 2026 года, денег не вернули. Требую вернуть только основной долг 100000 тенге, без процентов и неустойки. Доказательство: подписанная расписка, приложу её вручную. Срок добровольного исполнения выбираю до 1 ноября 2026 года, прошу ответить на e-mail заявителя. Претензию направлю самостоятельно заказным письмом по почте на указанный адрес должника. Покажите резюме всех реквизитов и требований для подтверждения.');
  console.log('Live OpenAI facts summary received');
  assert.deepEqual(summary.assistant.ai.missingFields,[],'The actual model must retain all supplied facts');
  assert.equal(summary.assistant.ai.readyForDraft,false);
  let final=await send('Подтверждаю. Все реквизиты, даты и требования в резюме верны. Подготовьте полный проект досудебной претензии по действующим нормам Республики Казахстан с проверенными официальными источниками.');
  console.log('Live OpenAI confirmed draft response received');
  if (!final.assistant.ai.readyForDraft) console.log(JSON.stringify({missingFields:final.assistant.ai.missingFields,sourceCount:final.assistant.ai.citations.length,answer:final.assistant.text.slice(0,500)}));
  if (!final.assistant.ai.readyForDraft && final.assistant.ai.factsConfirmed && !final.assistant.ai.missingFields.length) {
    const confirmedFacts=final.assistant.ai.facts;
    console.log('Official-source verification unavailable: retrying search once with previously confirmed facts');
    final=await send('Повторите поиск официальных источников и подготовьте претензию по уже подтверждённым реквизитам. Данные не изменились; не нужно запрашивать их заново. Включайте только проверенные нормы Республики Казахстан.');
    assert.deepEqual(final.assistant.ai.facts,confirmedFacts,'A repeated source search must retain the confirmed facts');
  }
  assert.equal(final.assistant.ai.readyForDraft,true,'Must produce an actual source-backed draft, not a stub');
  assert(final.assistant.ai.citations.every(source=>source.checkedAt&&/^https:\/\/(?:[^/]+\.)?(?:adilet\.zan\.kz|zan\.gov\.kz|sud\.gov\.kz|gov\.kz)\//.test(source.url)));
  assert(final.assistant.ai.draftBody.replace(/\s/g,'').includes('100000'));
  const friendly=await send('Спасибо! Как сохранить этот проект и скачать PDF?');
  assert.equal(friendly.assistant.ai.readyForDraft,true);
  assert.equal(friendly.assistant.ai.draftMessageId,final.assistant.ai.draftMessageId);
  assert.equal(friendly.assistant.ai.draftBody,final.assistant.ai.draftBody);
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
  const courtResponse=page.waitForResponse(response=>response.url().includes('/messages')&&response.request().method()==='POST',{timeout:180000});
  await page.getByRole('button',{name:'Перейти к подготовке иска в суд',exact:true}).click();
  assert((await courtResponse).ok(),'Court intake request must succeed');
  const courtHistory=await request(`/cases/${final.caseId}/messages`);
  const courtAssistant=courtHistory.filter(message=>message.role==='assistant').at(-1);
  assert.equal(courtAssistant.ai.documentKind,'court_claim');
  assert.equal(courtAssistant.ai.readyForDraft,false,'Court facts and a new confirmation are required');
  assert.equal(courtAssistant.ai.factsConfirmed,false);
  assert(courtAssistant.ai.missingFields.includes('pretrialStatus'),'Do not infer non-execution from a court-stage button');
  assert.equal(await page.locator('.appShell').getAttribute('data-view'),'home');
  assert.deepEqual(errors,[]);
  console.log('Live OpenAI court intake passed: explicit choice, no invented non-execution, fresh facts/confirmation and same home surface.');
  console.log('Live OpenAI E2E passed: real clarification, retained facts, confirmed official-source draft, reload, inline document and real PDF.');
} catch(error) {
  throw new Error(String(error?.message || error).split('Call log:')[0].slice(0,700));
} finally {
  try { if(userId) await request('/account',undefined,'DELETE'); }
  catch { console.error('Synthetic OpenAI account cleanup did not finish'); process.exitCode=1; }
  finally { await context.close(); await browser.close(); }
}
