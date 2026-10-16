import {readOfficialText,verifyOfficialQuote} from './official-sources';
const url='https://zan.gov.kz/client/#!/doc/123/rus';
const quote='Заемщик обязан возвратить предмет займа в подтвержденный договором срок.';
describe('official viewer document API',()=>{
  afterEach(()=>jest.restoreAllMocks());
  function mock(overrides:Record<string,unknown>={}){
    return jest.spyOn(global,'fetch').mockImplementation(async value=>{
      const request=new URL(String(value));
      return new Response(JSON.stringify({id:'internal-id',code:123,language:'rus',pagesCount:2,versionDate:'2026-01-01',actualVersion:true,content:request.searchParams.get('page')==='2' ? `<p>${quote}</p>` : '<p>Статья 1. Начало официального акта.</p>',...overrides}),{headers:{'content-type':'application/json'}});
    });
  }
  it('reads and verifies a quote on a later page, keeping the original official act identity',async()=>{
    const fetch=mock();
    expect(await verifyOfficialQuote(url,quote,new Map())).toBe(url);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(String(fetch.mock.calls[1][0])).toBe('https://zan.gov.kz/api/documents/123/rus?withHtml=true&page=2');
    expect(await readOfficialText(url)).toMatchObject({editionDate:'2026-01-01'});
  });
  it('reads a direct public document API URL using the same full-document verification',async()=>{
    mock();
    expect(await verifyOfficialQuote('https://zan.gov.kz/api/documents/123/rus',quote,new Map())).toBe('https://zan.gov.kz/api/documents/123/rus');
  });
  it('rejects a different document, language, excessive page count or unconfirmed current edition',async()=>{
    for(const overrides of [{code:456},{language:'kaz'},{pagesCount:201},{actualVersion:false}]) {
      mock(overrides);
      expect(await verifyOfficialQuote(url,quote,new Map())).toBeUndefined();jest.restoreAllMocks();
    }
  });
  it('does not silently replace a requested historical edition with a different version',async()=>{
    mock();
    expect(await verifyOfficialQuote(url+'/01.01.2025',quote,new Map())).toBeUndefined();
  });
});
