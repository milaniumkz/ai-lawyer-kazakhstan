import {recoverOfficialSources} from './source-recovery';
import {LegalService} from './legal.service';
import type {LegalRepository} from './repositories/legal.repository';

const citation = {url:'https://gov.kz/law/example',title:'Официальная публикация',article:'1',quote:'Синтетический текст официальной нормы для проверки резервного поиска источников.',effectiveDate:'2026-01-01'};
const options = {key:'test-key',model:'gpt-test',query:'Спор о долге в Республике Казахстан',signal:new AbortController().signal};
describe('independent official source recovery',()=>{
  afterEach(()=>jest.restoreAllMocks());
  function mock(source = citation, found = [source.url], text = source.quote) {
    return jest.spyOn(global,'fetch').mockImplementation(async url=>String(url).endsWith('/responses')
      ? new Response(JSON.stringify({output_text:JSON.stringify({citations:[source]}),output:[{action:{sources:found.map(url=>({url}))}}]}))
      : new Response(`<html>${text}</html>`,{headers:{'content-type':'text/html'}}));
  }
  it('searches the web independently then checks the official quoted text',async()=>{
    const fetch = mock();
    const sources = await recoverOfficialSources(options);
    expect(sources[0]).toMatchObject({...citation,checkedAt:expect.any(String)});
    const body = JSON.parse(fetch.mock.calls[0][1]?.body as string);
    expect(body.tools).toEqual([{type:'web_search'}]);
    expect(body.store).toBe(false);
  });
  it('rejects an invented URL not returned by web search',async()=>{
    const fetch = mock(citation,[]);
    expect(await recoverOfficialSources(options)).toEqual([]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('rejects blogs and nonmatching official quotes',async()=>{
    const fetch = mock({...citation,url:'https://example.com/blog'});
    expect(await recoverOfficialSources(options)).toEqual([]);
    expect(fetch).toHaveBeenCalledTimes(1);
    jest.restoreAllMocks();
    mock(citation,[citation.url],'Другой текст');
    expect(await recoverOfficialSources(options)).toEqual([]);
  });
  it('uses the official legacy publisher when the main publication returns an error',async()=>{
    const url='https://adilet.zan.kz/rus/docs/K990000409_';
    const fetch=mock({...citation,url});
    fetch.mockImplementation(async value=>String(value).endsWith('/responses')
      ? new Response(JSON.stringify({output_text:JSON.stringify({citations:[{...citation,url}]}),output:[{action:{sources:[{url}]}}]}))
      : String(value)===url ? new Response('',{status:503})
      : new Response(`<html>${citation.quote}</html>`,{headers:{'content-type':'text/html'}}));
    expect((await recoverOfficialSources(options))[0].url).toBe('https://old.adilet.zan.kz/rus/docs/K990000409_');
  });
  it('recovers when the local legal repository throws instead of stopping at the integration error',async()=>{
    const env=process.env;
    process.env={...env,AI_PROVIDER:'openai',AI_API_KEY:'test-key',OPENAI_MODEL:'gpt-test'};
    try {
      mock();
      const repository={searchFragments:jest.fn().mockRejectedValue(new Error('INDEX_UNAVAILABLE'))} as unknown as LegalRepository;
      expect(await new LegalService(repository).answer('Долг')).toMatchObject({status:'confirmed',sourceSearch:'web_fallback',citations:[expect.objectContaining({url:citation.url})]});
    } finally {process.env=env;}
  });
});
