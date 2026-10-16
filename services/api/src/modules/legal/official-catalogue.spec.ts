import {searchOfficialCatalogue} from './official-catalogue';
describe('public official act catalogue',()=>{
  afterEach(()=>jest.restoreAllMocks());
  it('uses anonymous legal-title searches and returns genuine current catalogue IDs, excluding amendments and revoked entries',async()=>{
    const fetch=jest.spyOn(global,'fetch').mockResolvedValue(new Response(JSON.stringify({list:[
      {code:'3582',status:'new',summary:{rus:'О введении в действие Гражданского кодекса'}},
      {code:'3559',status:'new',summary:{rus:'Гражданский кодекс Республики Казахстан (особенная часть)'}},
      {code:'999',status:'old',summary:{rus:'Гражданский кодекс'}},
      {code:'../private',status:'new',summary:{rus:'Гражданский кодекс'}},
    ]}),{headers:{'content-type':'application/json'}}));
    expect(await searchOfficialCatalogue(['Гражданский кодекс'],new AbortController().signal)).toEqual(['https://zan.gov.kz/client/#!/doc/3559/rus']);
    expect(fetch.mock.calls[0][0]).toBe('https://zan.gov.kz/api/documents/search');
    const options=fetch.mock.calls[0][1]!;
    expect(options.method).toBe('POST');expect(options.headers).toEqual({'Content-Type':'application/json'});
    expect(JSON.parse(options.body as string)).toMatchObject({search:'Гражданский кодекс',language:'rus',page:1,limit:10});
  });
  it('bounds title searches and does not pass arbitrary URLs or oversized text to the publisher',async()=>{
    const fetch=jest.spyOn(global,'fetch').mockImplementation(async()=>new Response(JSON.stringify({list:[]})));
    await searchOfficialCatalogue(['https://example.invalid/private','Частное имя и контакты','Закон 123456789012','x'.repeat(181),'Гражданский кодекс','Гражданский кодекс','Налоговый кодекс','Трудовой кодекс','Семейный кодекс'],new AbortController().signal);
    expect(fetch).toHaveBeenCalledTimes(3);
  });
  it('supports a full law title without putting the act-type prefix into the title query',async()=>{
    const fetch=jest.spyOn(global,'fetch').mockResolvedValue(new Response(JSON.stringify({list:[{code:'321',status:'new',summary:{rus:'О защите прав потребителей'}}]})));
    expect(await searchOfficialCatalogue(['Закон Республики Казахстан «О защите прав потребителей»'],new AbortController().signal)).toEqual(['https://zan.gov.kz/client/#!/doc/321/rus']);
    expect(JSON.parse(fetch.mock.calls[0][1]?.body as string).search).toBe('О защите прав потребителей');
  });
  it('matches a code title without letting generic jurisdiction words outrank the requested tax code',async()=>{
    const fetch=jest.spyOn(global,'fetch').mockResolvedValue(new Response(JSON.stringify({list:[
      {code:'879',status:'new',summary:{rus:'Гражданский кодекс Республики Казахстан'}},
      {code:'555',status:'new',summary:{rus:'О налогах и других обязательных платежах в бюджет (Налоговый кодекс)'}},
    ]})));
    expect(await searchOfficialCatalogue(['Налоговый кодекс Республики Казахстан'],new AbortController().signal)).toEqual(['https://zan.gov.kz/client/#!/doc/555/rus']);
    expect(JSON.parse(fetch.mock.calls[0][1]?.body as string).search).toBe('Налоговый кодекс');
  });
  it('does not turn a publisher failure into invented source identifiers',async()=>{
    jest.spyOn(global,'fetch').mockResolvedValue(new Response('',{status:503}));
    expect(await searchOfficialCatalogue(['Гражданский кодекс'],new AbortController().signal)).toEqual([]);
  });
});
