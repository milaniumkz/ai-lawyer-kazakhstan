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
});
