import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
const base=process.env.WEB_BASE_URL;
if(!base)throw new Error('WEB_BASE_URL_REQUIRED');
const engines=process.env.WEB_KEYBOARD_BROWSERS?.split(',') || ['chromium','webkit'];
for(const name of engines){
  const browser=await ({chromium,webkit}[name]).launch();
  try {
    for(const size of [{width:320,height:568},{width:390,height:844}]){
      const context=await browser.newContext({viewport:size});
      const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
      const history=Array.from({length:30},(_,index)=>({role:index%2?'user':'assistant',text:`Синтетическое сообщение ${index}. `+'Текст истории обращения. '.repeat(12)}));
      const sent=[];
      await page.addInitScript(({size,history})=>{
        const viewport=Object.assign(new EventTarget(),{height:size.height,width:size.width,offsetTop:0,offsetLeft:0,scale:1});
        Object.defineProperty(window,'visualViewport',{configurable:true,value:viewport});
        window.setTestKeyboard=(height,top=0)=>{viewport.height=size.height-height;viewport.offsetTop=top;viewport.dispatchEvent(new Event('resize'));};
        localStorage.setItem('ai-lawyer-web-state',JSON.stringify({view:'home',theme:'dark',authUserId:'00000000-0000-4000-8000-000000000001',profileComplete:true,profileName:'Тест клавиатуры',draftCaseId:'keyboard-draft',remoteCaseId:'keyboard-case',remoteCaseDraftId:'keyboard-draft',activeCaseId:'keyboard-case',homeConversationOpen:true,messages:history,cases:[],documents:[]}));
        localStorage.setItem('aizan-chat-mode','ai');
      },{size,history});
      // Layout and key-event fixtures only; real OpenAI/document checks run separately.
      await page.route('**/api/v1/**',async route=>{
        const request=route.request(),path=new URL(request.url()).pathname;
        let body=[];
        if(path.endsWith('/health'))body={aiConversationEnabled:true};
        else if(path.endsWith('/messages')){
          if(request.method()==='POST'){const outgoing=request.postDataJSON();sent.push(outgoing.text);history.push({role:'user',text:outgoing.text},{role:'assistant',text:'Синтетический ответ для проверки поля ввода.'});}
          body=history;
        }
        await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
      });
      await page.goto(`${base}/#home`);
      const input=page.locator('#home-problem');await input.waitFor();await input.focus();
      await page.getByRole('button',{name:'Пошаговое заполнение',exact:true}).waitFor();
      assert.equal(await input.getAttribute('enterkeyhint'),'send');
      for(const [height,top] of [[250,0],[300,0],[Math.min(410,size.height-190),30]]){
        await page.evaluate(([height,top])=>window.setTestKeyboard(height,top),[height,top]);
        await page.waitForFunction(offset=>{
          const shell=document.querySelector('.appShell');
          return shell?.getAttribute('data-keyboard-open')==='true' && Math.abs(parseFloat(shell.style.getPropertyValue('--chat-keyboard-offset'))-offset)<1;
        },Math.max(0,height-top));
        const {arrow,field}=await page.evaluate(()=>({arrow:document.querySelector('.aizanComposerSend').getBoundingClientRect().toJSON(),field:document.querySelector('#home-problem').getBoundingClientRect().toJSON()}));
        assert(arrow.y+arrow.height<=size.height-height+top+1,`${name}: send arrow hidden by keyboard ${JSON.stringify({size,height,top,arrow})}`);
        assert(field.y>=top,`${name}: message field above visible viewport`);
        assert(arrow.x>=0 && arrow.x+arrow.width<=size.width,`${name}: arrow outside screen`);
        assert.equal(await page.locator('.bottomNav').isVisible(),false);
      }
      await input.fill('Сообщение через Enter');await input.press('Enter');
      await page.waitForFunction(()=>document.querySelector('#home-problem')?.value==='');
      assert.deepEqual(sent,['Сообщение через Enter']);
      await input.fill('Первая строка');await input.press('Shift+Enter');
      assert((await input.inputValue()).includes('\n'));assert.equal(sent.length,1);
      await input.fill('Сообщение стрелкой');await page.locator('.aizanComposerSend').click();
      await page.waitForFunction(()=>document.querySelector('#home-problem')?.value==='');
      assert.deepEqual(sent,['Сообщение через Enter','Сообщение стрелкой']);
      await page.evaluate(()=>window.setTestKeyboard(0));
      await page.waitForFunction(()=>document.querySelector('.appShell')?.getAttribute('data-keyboard-open')==='false');
      assert.equal(await page.locator('.bottomNav').isVisible(),true);
      assert.equal(await page.locator('.appShell').getAttribute('data-view'),'home');
      assert.deepEqual(errors,[]);
      await context.close();
    }
  } finally {await browser.close();}
  console.log(`${name}: simulated mobile keyboards keep composer/arrow visible; Enter and arrow each send once; Shift+Enter preserves newline.`);
}
