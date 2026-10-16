import { generateOpenAiConversation } from './openai-conversation.adapter';
import type { MessageRecord, AiConversation } from '../cases/cases.types';

const facts = {
  claimantName: 'Тестовый заявитель', claimantContact: 'Алматы, qa@example.invalid',
  respondentName: 'Тестовый должник', respondentContact: 'Алматы, debtor@example.invalid',
  circumstances: 'Долг 100000 тенге по расписке, не возвращён', eventDate: '2026-01-12',
  demands: 'Вернуть 100000 тенге', evidence: 'Расписка', deadline: 'До 2026-11-01',
};
const citation = {url: 'https://adilet.zan.kz/rus/docs/test', title: 'Гражданский кодекс РК', article: '272', quote: 'Обязательство должно исполняться надлежащим образом в соответствии с условиями обязательства.', effectiveDate: '2026-01-01'};
const draftBody = ('Полная претензия тестового заявителя к тестовому должнику. Требуется вернуть 100000 тенге на основании расписки. ').repeat(5);
const previous: AiConversation = { provider: 'openai', model: 'gpt-test', facts, missingFields: [], citations: [], readyForDraft: false };
const turn = (text: string): MessageRecord[] => [
  {id: 'summary', caseId: 'case', role: 'assistant', text: 'Проверьте сведения и подтвердите', createdAt: '', ai: previous},
  {id: 'user', caseId: 'case', role: 'user', text, createdAt: ''},
];
describe('OpenAI conversation', () => {
  const originalEnv = process.env;
  beforeEach(() => { process.env = {...originalEnv, AI_API_KEY: 'test-key', OPENAI_MODEL: 'gpt-test'}; jest.restoreAllMocks(); });
  afterAll(() => { process.env = originalEnv; });
  function mock(answer: Record<string, unknown>, sources = [citation.url]) {
    return jest.spyOn(global, 'fetch').mockImplementation(async url => {
      if (String(url).endsWith('/responses')) return new Response(JSON.stringify({output_text: JSON.stringify(answer), output: [{type:'web_search_call', action:{sources:sources.map(url=>({url}))}}]}),{status:200});
      return new Response(`<html><body>${citation.quote}</body></html>`,{status:200,headers:{'content-type':'text/html'}});
    });
  }
  it('sends conversation history and asks about missing recipient without producing a draft', async () => {
    const fetchMock = mock({answer: 'Кому направляем претензию?', facts: {...facts, respondentName:'', respondentContact:''}, draftBody:null, citations:[]});
    const result = await generateOpenAiConversation('Проблема с долгом',turn('Хочу подготовить претензию'));
    expect(result.ai.missingFields).toEqual(['respondentName','respondentContact']);
    expect(result.ai.readyForDraft).toBe(false);
    const payload=JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(payload.input.at(-1).content).toBe('Хочу подготовить претензию');
    expect(payload.tools[0].filters.allowed_domains).toContain('adilet.zan.kz');
    expect(payload.store).toBe(false);
    expect(payload.tool_choice).toBe('required');
  });
  it('produces a draft only after confirmation and an actual official quote match', async () => {
    mock({answer:'Проект подготовлен', facts, draftBody, citations:[citation]});
    const result=await generateOpenAiConversation('Долг',turn('Подтверждаю'));
    expect(result.ai.readyForDraft).toBe(true);
    expect(result.ai.draftBody).toBe(draftBody.trim());
    expect(result.ai.citations[0].checkedAt).toBeDefined();
  });
  it('keeps the first clarification fast without invoking premature legal search', async () => {
    const fetchMock=mock({answer:'Кому направляем претензию?',facts:{...facts,respondentName:''},draftBody:null,citations:[]});
    await generateOpenAiConversation('Невозвращённый долг',[{id:'first',caseId:'case',role:'user',text:'Хочу подготовить претензию',createdAt:''}]);
    const payload=JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(payload.tool_choice).toBe('none');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('asks the next question without a premature unknown-fields summary', async () => {
    mock({answer:'Вопрос 1: За какие месяцы не выплатили зарплату?\n\nКраткое резюме того, что есть сейчас:\n— Заявитель: неизвестно',facts:{...facts,claimantName:''},draftBody:null,citations:[]});
    const result=await generateOpenAiConversation('Работодатель не платит зарплату',[]);
    expect(result.text).toBe('За какие месяцы не выплатили зарплату?');
    expect(result.ai.missingFields).toContain('claimantName');
    expect(result.ai.readyForDraft).toBe(false);
  });
  it('sends the attached photo as actual multimodal input', async () => {
    const fetchMock=mock({answer:'На фото виден договор. Кто заявитель?',facts:{...facts,claimantName:''},draftBody:null,citations:[]});
    const image={id:'image',fileName:'photo.png',mimeType:'image/png',sizeBytes:4,dataUrl:'data:image/png;base64,dGVzdA=='};
    await generateOpenAiConversation('Договор',[{id:'user',caseId:'case',role:'user',text:'Посмотрите фото',createdAt:''}],[image]);
    const payload=JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(payload.input.at(-1).content).toContainEqual({type:'input_image',image_url:image.dataUrl,detail:'auto'});
  });
  it('rejects invented sources and a negated confirmation', async () => {
    mock({answer:'Проект',facts,draftBody,citations:[citation]},[]);
    expect((await generateOpenAiConversation('Долг',turn('Подтверждаю'))).ai.readyForDraft).toBe(false);
    expect((await generateOpenAiConversation('Долг',turn('Не подтверждаю'))).ai.draftBody).toBeUndefined();
  });
  it('recomposes the document from verified norms instead of retaining an invented reference', async () => {
    const unsafeUrl='https://example.com/unsupported-law';
    const fetchMock=jest.spyOn(global,'fetch').mockImplementation(async (url,options) => {
      if(String(url).endsWith('/responses')) {
        const payload=JSON.parse(options?.body as string);
        if(payload.text.format.name==='aizan_verified_claim') {
          expect(payload.input[1].content).not.toContain(unsafeUrl);
          return new Response(JSON.stringify({output_text:JSON.stringify({body:draftBody,citedUrls:[citation.url]})}));
        }
        return new Response(JSON.stringify({output_text:JSON.stringify({answer:'Проект',facts,draftBody:draftBody+unsafeUrl,citations:[citation,{...citation,url:unsafeUrl}]}),output:[{action:{sources:[{url:citation.url}]}}]}));
      }
      return new Response(`<html>${citation.quote}</html>`,{headers:{'content-type':'text/html'}});
    });
    const result=await generateOpenAiConversation('Долг',turn('Подтверждаю'));
    expect(result.ai.readyForDraft).toBe(true);
    expect(result.ai.draftBody).not.toContain(unsafeUrl);
    expect(result.ai.citations).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
  it('does not approve an absent quote or a redirect to an unrelated host', async () => {
    const fetchMock=mock({answer:'Проект',facts,draftBody,citations:[citation]});
    fetchMock.mockImplementation(async url => String(url).endsWith('/responses') ? new Response(JSON.stringify({output_text:JSON.stringify({answer:'Проект',facts,draftBody,citations:[citation]}),output:[{action:{sources:[{url:citation.url}]}}]})) : new Response(null,{status:302,headers:{location:'https://example.com/fake'}}));
    expect((await generateOpenAiConversation('Долг',turn('Подтверждаю'))).ai.readyForDraft).toBe(false);
    expect(fetchMock.mock.calls.some(call=>String(call[0]).includes('example.com'))).toBe(false);
  });
  it('reads the publisher-provided official legacy viewer when the new site serves a JS shell', async () => {
    const modern='https://adilet.zan.kz/rus/docs/K990000409_';
    const legacy='https://old.adilet.zan.kz/rus/docs/K990000409_';
    jest.spyOn(global,'fetch').mockImplementation(async (url,options) => {
      if(String(url).endsWith('/responses')) {
        const payload=JSON.parse(options?.body as string);
        return new Response(JSON.stringify(payload.text.format.name==='aizan_verified_claim'
          ? {output_text:JSON.stringify({body:draftBody,citedUrls:[legacy]})}
          : {output_text:JSON.stringify({answer:'Проект',facts,draftBody:draftBody+modern,citations:[{...citation,url:modern}]}),output:[{action:{sources:[{url:legacy}]}}]}));
      }
      return new Response(String(url)===modern ? '<html>Для работы с текстами актов включите JavaScript.</html>' : `<html>${citation.quote}</html>`,{headers:{'content-type':'text/html'}});
    });
    const result=await generateOpenAiConversation('Долг',turn('Подтверждаю'));
    expect(result.ai.readyForDraft).toBe(true);
    expect(result.ai.citations[0].url).toBe(legacy);
    expect(result.ai.citations[0].checkedAt).toBeDefined();
  });
  it('reports provider failure instead of a fabricated assistant answer', async () => {
    jest.spyOn(global,'fetch').mockResolvedValue(new Response('{}',{status:503}));
    await expect(generateOpenAiConversation('Долг',turn('Кто получатель?'))).rejects.toMatchObject({response:{code:'OPENAI_TEMPORARILY_UNAVAILABLE'}});
  });
  it('retains the prepared draft and its original verification after a PDF follow-up', async () => {
    const checkedAt='2026-10-01T10:00:00.000Z';
    const history=turn('Спасибо, как скачать PDF?');
    history[0].ai={...previous,factsConfirmed:true,readyForDraft:true,draftBody,draftMessageId:'prepared-id',citations:[{...citation,checkedAt}]};
    const fetchMock=mock({answer:'Нажмите Скачать PDF',facts,draftBody:null,citations:[]});
    const result=await generateOpenAiConversation('Долг',history);
    expect(result.ai.readyForDraft).toBe(true);
    expect(result.ai.draftMessageId).toBe('prepared-id');
    expect(result.ai.citations[0].checkedAt).toBe(checkedAt);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('preserves confirmed facts after a source outage but invalidates them after an amount change', async () => {
    mock({answer:'Проект',facts,draftBody,citations:[citation]},[]);
    const blocked=await generateOpenAiConversation('Долг',turn('Подтверждаю'));
    expect(blocked.ai.factsConfirmed).toBe(true);
    expect(blocked.ai.readyForDraft).toBe(false);
    jest.restoreAllMocks();
    mock({answer:'Уточните новую сумму',facts:{...facts,demands:'Вернуть 200000 тенге'},draftBody:null,citations:[]});
    const history=turn('Измените сумму требования на 200000 тенге');
    history[0].ai=blocked.ai;
    const changed=await generateOpenAiConversation('Долг',history);
    expect(changed.ai.factsConfirmed).toBe(false);
    expect(changed.ai.readyForDraft).toBe(false);
  });
  it('automatically recovers missing sources and completes the claim without another user message', async () => {
    const names:string[]=[];
    jest.spyOn(global,'fetch').mockImplementation(async (url,options)=>{
      if(!String(url).endsWith('/responses')) return new Response(`<html>${citation.quote}</html>`,{headers:{'content-type':'text/html'}});
      const payload=JSON.parse(options?.body as string); names.push(payload.text.format.name);
      if(payload.text.format.name==='aizan_source_recovery') {
        expect(payload.input[1].content).not.toContain(facts.claimantContact);
        return new Response(JSON.stringify({output_text:JSON.stringify({citations:[citation]}),output:[{action:{sources:[{url:citation.url}]}}]}));
      }
      if(payload.text.format.name==='aizan_verified_claim') return new Response(JSON.stringify({output_text:JSON.stringify({body:draftBody,citedUrls:[citation.url]})}));
      return new Response(JSON.stringify({output_text:JSON.stringify({answer:'Не удалось найти нормы',facts,draftBody:null,citations:[]})}));
    });
    const result=await generateOpenAiConversation('Долг',turn('Подтверждаю'));
    expect(result.ai).toMatchObject({readyForDraft:true,factsConfirmed:true,sourceSearch:'web_fallback',facts});
    expect(names).toEqual(['aizan_conversation','aizan_source_recovery','aizan_verified_claim']);
  });
  it('recovers a primary search provider error on confirmation without changing confirmed facts',async()=>{
    jest.spyOn(global,'fetch').mockImplementation(async (url,options)=>{
      if(!String(url).endsWith('/responses')) return new Response(`<html>${citation.quote}</html>`,{headers:{'content-type':'text/html'}});
      const payload=JSON.parse(options?.body as string);
      if(payload.text.format.name==='aizan_conversation') return new Response('',{status:503});
      if(payload.text.format.name==='aizan_source_recovery') return new Response(JSON.stringify({output_text:JSON.stringify({citations:[citation]}),output:[{action:{sources:[{url:citation.url}]}}]}));
      return new Response(JSON.stringify({output_text:JSON.stringify({body:draftBody,citedUrls:[citation.url]})}));
    });
    expect((await generateOpenAiConversation('Долг',turn('Подтверждаю. Все реквизиты верны. Подготовьте полный проект по действующим нормам Республики Казахстан.'))).ai).toMatchObject({readyForDraft:true,sourceSearch:'web_fallback',facts});
  });
  it('preserves confirmation when composition fails instead of asking to restart intake',async()=>{
    jest.spyOn(global,'fetch').mockImplementation(async (url,options)=>{
      if(!String(url).endsWith('/responses')) return new Response(`<html>${citation.quote}</html>`,{headers:{'content-type':'text/html'}});
      const payload=JSON.parse(options?.body as string);
      return payload.text.format.name==='aizan_verified_claim' ? new Response('',{status:503}) : new Response(JSON.stringify({output_text:JSON.stringify({answer:'Готовлю документ',facts,draftBody:null,citations:[citation]}),output:[{action:{sources:[{url:citation.url}]}}]}));
    });
    const result=await generateOpenAiConversation('Долг',turn('Подтверждаю'));
    expect(result.ai).toMatchObject({readyForDraft:false,factsConfirmed:true,facts});
    expect(result.text).toContain('не смогла завершить');
  });
  it('does not reuse old confirmed facts after a primary error when the user changes the amount',async()=>{
    const fetch=jest.spyOn(global,'fetch').mockResolvedValue(new Response('',{status:503}));
    await expect(generateOpenAiConversation('Долг',turn('Подтверждаю, но измените сумму на 200000 тенге'))).rejects.toMatchObject({response:{code:'OPENAI_TEMPORARILY_UNAVAILABLE'}});
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  const courtFacts={...facts,courtName:'Тестовый суд',courtAddress:'Тестовый адрес суда',claimantAddress:'Тестовый адрес истца',claimantIdentifier:'Уточнено пользователем',respondentAddress:'Тестовый адрес ответчика',respondentIdentifier:'Не известен пользователю; требуется проверка',claimValue:'100000 тенге',stateDuty:'Подлежит проверке по нормам',pretrialDispatch:'Направлена 01.09.2026, получена 03.09.2026, имеется подтверждение получения',pretrialOutcome:'После применимого срока требования не исполнены, спор сохраняется',pretrialStatus:'unresolved'};
  it('switches to court intake only after pretrial preparation and asks for a new confirmation',async()=>{
    mock({answer:'Проверьте судебные реквизиты',facts:courtFacts,draftBody:null,citations:[]});
    const messages=turn('Хочу перейти к подготовке искового заявления в суд');
    messages[0].ai={...previous,readyForDraft:true,factsConfirmed:true,draftBody,citations:[{...citation,checkedAt:'2026-01-01T00:00:00Z'}]};
    const result=await generateOpenAiConversation('Долг',messages);
    expect(result.ai).toMatchObject({documentKind:'court_claim',factsConfirmed:false,readyForDraft:false,missingFields:[]});
    expect(result.text).toContain('Проверьте данные для искового заявления в суд');
  });
  it.each(['not_sent','waiting','fulfilled'])('does not prepare a court claim when pretrial status is %s',async status=>{
    const current={...courtFacts,pretrialStatus:status};
    mock({answer:'Подготовлю иск',facts:current,draftBody,citations:[citation]});
    const messages=turn('Подтверждаю');
    messages[0].ai={...previous,documentKind:'court_claim',facts:current,factsConfirmed:true};
    const result=await generateOpenAiConversation('Долг',messages);
    expect(result.ai.readyForDraft).toBe(false);
    expect(result.ai.missingFields).toContain('pretrialStatus');
    expect(result.ai.draftBody).toBeUndefined();
  });
  it('composes a separate court document from confirmed court facts and verified norms',async()=>{
    const courtBody=('Исковое заявление в суд. Истец просит взыскать задолженность. ').repeat(8);
    jest.spyOn(global,'fetch').mockImplementation(async (url,options)=>{
      if(!String(url).endsWith('/responses')) return new Response(`<html>${citation.quote}</html>`,{headers:{'content-type':'text/html'}});
      const payload=JSON.parse(options?.body as string);
      if(payload.text.format.name==='aizan_verified_claim') {
        expect(payload.input[0].content).toContain('Составь исковое заявление в суд');
        return new Response(JSON.stringify({output_text:JSON.stringify({body:courtBody,citedUrls:[citation.url]})}));
      }
      return new Response(JSON.stringify({output_text:JSON.stringify({answer:'Готовлю иск',facts:courtFacts,draftBody:null,citations:[citation]}),output:[{action:{sources:[{url:citation.url}]}}]}));
    });
    const messages=turn('Подтверждаю');
    messages[0].ai={...previous,documentKind:'court_claim',facts:courtFacts};
    const result=await generateOpenAiConversation('Долг',messages);
    expect(result.ai).toMatchObject({documentKind:'court_claim',readyForDraft:true,draftBody:courtBody.trim()});
    expect(result.text).toContain('не подаёт иск автоматически');
  });

});
