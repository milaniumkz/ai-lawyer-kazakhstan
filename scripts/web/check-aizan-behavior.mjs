import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const baseUrl = process.env.WEB_BASE_URL;
if (!baseUrl) { console.log('AIZAN behavior skipped: WEB_BASE_URL is not set'); process.exit(0); }
const browser=await chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox']} : {});
const page=await browser.newPage({viewport:{width:390,height:845}});
await page.route('**/api/v1/**',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'API unavailable in behavior test'})}));
await page.addInitScript(()=>{
 localStorage.setItem('ai-lawyer-web-state',JSON.stringify({view:'home',theme:'dark',authUserId:'test-user',profileComplete:true,caseText:'Мой сохранённый текст обращения',cases:[],documents:[]}));
 Object.defineProperty(navigator,'mediaDevices',{value:{getUserMedia:()=>Promise.reject(new DOMException('Denied','NotAllowedError'))},configurable:true});
});
await page.goto(baseUrl.replace(/\/$/, '') + '/#home');await page.waitForTimeout(200);
await page.getByRole('button',{name:'Ввести текст',exact:true}).click();
await page.locator('.recordCard textarea').waitFor();
assert.equal(await page.locator('.recordCard textarea').inputValue(),'Мой сохранённый текст обращения');
await page.getByRole('button',{name:'Назад',exact:true}).first().click();
await page.getByRole('button',{name:'Рассказать проблему',exact:true}).click();
await page.getByRole('status').waitFor();
assert.match(await page.getByRole('status').innerText(),/Микрофон недоступен/);
assert.equal(await page.locator('.recordCard textarea').inputValue(),'Мой сохранённый текст обращения');
await page.getByRole('button',{name:'Назад',exact:true}).first().click();
await page.getByRole('button',{name:'Новое дело',exact:true}).click();
assert.equal(await page.locator('.recordCard textarea').inputValue(),'');
await page.locator('.bottomNav').getByRole('button',{name:'Документы',exact:true}).click();
await page.getByRole('button',{name:'Шаблоны',exact:true}).click();
assert.equal(await page.getByRole('button',{name:'Шаблоны',exact:true}).getAttribute('class'),'active');
assert.equal(await page.locator('.nativeUploadControl input[type=file]').count(),2);
await browser.close();
console.log('AIZAN behavior: text preserved, microphone denial visible, explicit new draft resets text, document tabs/native file inputs work');
