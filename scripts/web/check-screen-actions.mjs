import assert from 'node:assert/strict';
import {chromium} from 'playwright';

// Real authenticated API operations with an explicitly synthetic account.
// No successful API response, payment, document delivery or AI response is mocked.
const base=process.env.WEB_BASE_URL;
if(!base)throw new Error('WEB_BASE_URL_REQUIRED');
const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:390,height:844}});
const page=await context.newPage();
const errors=[];page.on('pageerror',error=>errors.push(error.message));
let registered=false;
try {
  await page.goto(`${base}/#login`);
  await page.getByRole('button',{name:/Войти по e-mail/}).click();
  await page.locator('#auth-email').fill(`screen-qa-${crypto.randomUUID()}@example.invalid`);
  await page.getByRole('button',{name:'Получить код',exact:true}).click();
  await page.locator('.appShell[data-view="otp"]').waitFor();
  const first=JSON.parse(await page.evaluate(()=>localStorage.getItem('ai-lawyer-web-state')));
  assert(first.otpId);
  await page.getByRole('button',{name:'Запросить код повторно',exact:true}).click();
  await page.waitForFunction(id=>JSON.parse(localStorage.getItem('ai-lawyer-web-state')).otpId!==id,first.otpId);
  const hint=await page.locator('.otpHint').textContent();
  const code=hint.match(/\b\d{6}\b/)?.[0];
  assert(code,'This QA flow requires explicit test OTP mode, never real SMS/email');
  await page.locator('.otpInput').fill(code);
  await page.getByRole('button',{name:/Подтвердить$/}).click();
  await page.locator('.appShell[data-view="register"]').waitFor();registered=true;
  await page.getByPlaceholder('Имя',{exact:true}).fill('Тест');
  await page.getByPlaceholder('Фамилия',{exact:true}).fill('Проверка интерфейса');
  await page.getByPlaceholder('Город',{exact:true}).fill('Алматы');
  await page.locator('.authExactPanel input[type=checkbox]').check();
  await page.getByRole('button',{name:/Создать аккаунт$/}).click();
  await page.locator('.appShell[data-view="home"]').waitFor();
  await page.getByRole('button',{name:'Ввести текст',exact:true}).click();
  const draft='Сохранённое описание для проверки переходов';
  await page.locator('#home-problem').fill(draft);
  await page.locator('#home-problem').blur(); // Dismiss typing before using the bottom navigation.
  await page.locator('.bottomNav').getByRole('button',{name:'Профиль',exact:true}).click();
  await page.getByRole('button',{name:'Помощь и поддержка',exact:true}).click();
  await page.getByPlaceholder('Найдите ответ на вопрос').fill('документы');
  await page.getByRole('status').filter({hasText:'Документы и фото'}).waitFor();
  await page.getByRole('textbox',{name:'Вопрос поддержке',exact:true}).fill('Синтетический вопрос для проверки экрана поддержки');
  await page.getByRole('button',{name:'Обновить обращения',exact:true}).click();
  assert.equal((await context.request.get(`${base}/api/v1/support/tickets`).then(response=>response.json())).length,0,'Refreshing tickets must not submit the unsent question');
  await page.getByRole('button',{name:'Написать в поддержку',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('textarea[aria-label="Вопрос поддержке"]')?.value==='');
  assert.equal((await context.request.get(`${base}/api/v1/support/tickets`).then(response=>response.json())).length,1);
  await page.locator('.bottomNav').getByRole('button',{name:'Главная',exact:true}).click();
  assert.equal(await page.locator('#home-problem').inputValue(),draft);
  await page.locator('.bottomNav').getByRole('button',{name:'Профиль',exact:true}).click();
  for(const [button,view] of [['Календарь и сроки','deadlines'],['Нормы права','legal'],['Подписка','subscription']]) {
    await page.getByRole('button',{name:button,exact:true}).click();
    await page.locator(`.appShell[data-view="${view}"]`).waitFor();
    await page.locator('.bottomNav').getByRole('button',{name:'Профиль',exact:true}).click();
  }
  await page.getByRole('button',{name:'Безопасность',exact:false}).click();
  await page.locator('.appShell[data-view="settings"]').waitFor();
  const [exported]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Экспортировать данные',exact:true}).click()]);
  assert.match(exported.suggestedFilename(),/\.json$/);
  page.once('dialog',dialog=>dialog.dismiss());
  await page.getByRole('button',{name:'Удалить аккаунт',exact:true}).click();
  assert((await context.request.get(`${base}/api/v1/profiles`)).ok(),'Cancelling deletion must retain the account');
  assert.deepEqual(errors,[]);
  console.log('Real screen actions passed: email OTP/resend/registration, profile navigation, help search without losing draft, legal/calendar/subscription access, account export and cancelled deletion.');
} catch(error) {
  await page.screenshot({path:'/tmp/aizan-screen-actions-failure.png',fullPage:true}).catch(()=>{});
  throw new Error(String(error?.message || error).split('Call log:')[0].slice(0,500));
} finally {
  if(registered){const removed=await context.request.delete(`${base}/api/v1/account`);assert(removed.ok(),'Synthetic account cleanup failed');}
  await context.close();await browser.close();
}
