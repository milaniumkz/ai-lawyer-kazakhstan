import {recoverOfficialSources,selectRelevantOfficialText} from './source-recovery';
import {canonicalUrl,officialSourceIdentity} from './official-sources';
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
    expect(body.tools[0]).toMatchObject({type:'web_search',filters:{allowed_domains:expect.arrayContaining(['gov.kz','egov.kz','sud.gov.kz'])}});
    expect(body.tools[0].filters.allowed_domains).not.toContain('adilet.zan.kz');
    const allowedUrl=new RegExp(body.text.format.schema.properties.citations.items.properties.url.pattern);
    expect(allowedUrl.test('https://adilet.zan.kz/rus/docs/K990000409_')).toBe(true);
    expect(allowedUrl.test('https://adilet.kz/rus/docs/K990000409_')).toBe(false);
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
  it('retains a matched official quote without inventing an unknown edition date',async()=>{
    mock({...citation,effectiveDate:''});
    expect((await recoverOfficialSources(options))[0]).toMatchObject({effectiveDate:'',editionVerified:false,verificationMethod:'official_text'});
  });
  it('requires an actual completed official open_page for a public PDF fallback',async()=>{
    const source={...citation,url:'https://www.gov.kz/uploads/legal-code.pdf'};
    const fetch=jest.spyOn(global,'fetch').mockImplementation(async url=>String(url).endsWith('/responses')
      ? new Response(JSON.stringify({output_text:JSON.stringify({citations:[source]}),output:[{type:'web_search_call',status:'completed',action:{type:'open_page',url:source.url}}]}))
      : new Response('public legal PDF',{headers:{'content-type':'application/pdf'}}));
    expect((await recoverOfficialSources(options))[0]).toMatchObject({verificationMethod:'openai_web_search',checkedAt:expect.any(String)});
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it('opens discovered official sources in a bounded separate reading step when search returned snippets only',async()=>{
    let requests=0;
    const fetch=jest.spyOn(global,'fetch').mockImplementation(async (url,options)=>{
      if (!String(url).endsWith('/responses')) return new Response('',{status:503});
      requests++;
      if (requests===2) expect(JSON.parse(options?.body as string).input[1].content).toContain('officialUrlsToRead');
      return new Response(JSON.stringify({output_text:JSON.stringify({citations:[citation]}),output:requests===1 ? [{action:{sources:[{url:citation.url}]}}] : [{type:'web_search_call',status:'completed',action:{type:'open_page',url:citation.url}}]}));
    });
    expect((await recoverOfficialSources(options))[0]).toMatchObject({verificationMethod:'openai_web_search'});
    expect(requests).toBe(2);
    expect(fetch).toHaveBeenCalledTimes(4);
  });
  it('reads official search URLs even when discovery returns no unverified citations',async()=>{
    let requests=0;
    jest.spyOn(global,'fetch').mockImplementation(async url=>{
      if (!String(url).endsWith('/responses')) return new Response('',{status:503});
      requests++;
      return new Response(JSON.stringify({output_text:JSON.stringify({citations:requests===1 ? [] : [citation]}),output:requests===1 ? [{action:{sources:[{url:citation.url}]}}] : [{type:'web_search_call',status:'completed',action:{type:'open_page',url:citation.url}}]}));
    });
    expect((await recoverOfficialSources(options))[0]).toMatchObject({verificationMethod:'openai_web_search'});
    expect(requests).toBe(2);
  });
  it('keeps separate official SPA document routes distinct while removing ordinary anchors',()=>{
    expect(officialSourceIdentity('https://law.gov.kz/client/#!/doc/1/rus')).not.toBe(officialSourceIdentity('https://law.gov.kz/client/#!/doc/2/rus'));
    expect(canonicalUrl('https://gov.kz/legal#article-1')).toBe('https://gov.kz/legal');
  });
  it('includes a relevant late article when a retrieved official act exceeds the excerpt budget',()=>{
    const article='статья 716. заемщик возвращает заем по расписке. ';
    const text='статья 1. '+ 'Общие положения официального акта. '.repeat(2500)+article;
    const excerpt=selectRelevantOfficialText(text,'Заём по расписке не возвращён');
    expect(excerpt).toContain(article);expect(excerpt.length).toBeLessThanOrEqual(60000);
  });
  it('requires edition review when a model date differs from the official publisher version',async()=>{
    const source={...citation,url:'https://zan.gov.kz/client/#!/doc/123/rus',effectiveDate:'2025-01-01'};
    jest.spyOn(global,'fetch').mockImplementation(async url=>String(url).endsWith('/responses')
      ? new Response(JSON.stringify({output_text:JSON.stringify({citations:[source]}),output:[{action:{sources:[{url:source.url}]}}]}))
      : new Response(JSON.stringify({id:123,code:123,language:'rus',pagesCount:1,versionDate:'2026-01-01',actualVersion:true,content:source.quote}),{headers:{'content-type':'application/json'}}));
    expect((await recoverOfficialSources(options))[0]).toMatchObject({verificationMethod:'official_text',editionVerified:false});
  });
  it('recovers current official text from the public catalogue when web discovery has no usable act URL',async()=>{
    let requests=0;
    const source={...citation,url:'https://zan.gov.kz/client/#!/doc/3559/rus'};
    jest.spyOn(global,'fetch').mockImplementation(async (url,options)=>{
      if(String(url).endsWith('/responses')){
        requests++;
        if(requests===2){
          const evidence=JSON.parse(JSON.parse(options?.body as string).input[1].content).officialExcerpts[0];
          expect(evidence).toMatchObject({url:source.url,editionDate:'2026-01-01',title:'Гражданский кодекс'});
          expect(evidence.text).toContain(citation.quote.toLocaleLowerCase());
        }
        return new Response(JSON.stringify({output_text:JSON.stringify({citations:requests===1 ? [] : [source],actSearchQueries:requests===1 ? ['Гражданский кодекс'] : []}),output:[]}));
      }
      if(String(url).endsWith('/search'))return new Response(JSON.stringify({list:[{code:'3559',status:'new',summary:{rus:'Гражданский кодекс'}}]}));
      return new Response(JSON.stringify({code:'3559',language:'rus',pagesCount:1,versionDate:'2026-01-01',actualVersion:true,metadata:{title:{rus:'Гражданский кодекс'}},content:source.quote}),{headers:{'content-type':'application/json'}});
    });
    expect((await recoverOfficialSources(options))[0]).toMatchObject({url:source.url,verificationMethod:'official_text',editionVerified:true});
    expect(requests).toBe(2);
  });
  it('shows the actual publisher title and edition date when the model leaves the date unknown',async()=>{
    const source={...citation,url:'https://zan.gov.kz/client/#!/doc/123/rus',title:'Сокращённый заголовок модели',effectiveDate:''};
    jest.spyOn(global,'fetch').mockImplementation(async url=>String(url).endsWith('/responses')
      ? new Response(JSON.stringify({output_text:JSON.stringify({citations:[source]}),output:[{action:{sources:[{url:source.url}]}}]}))
      : new Response(JSON.stringify({code:'123',language:'rus',pagesCount:1,versionDate:'2026-01-01',actualVersion:true,metadata:{title:{rus:'Официальное название акта'}},content:source.quote}),{headers:{'content-type':'application/json'}}));
    expect((await recoverOfficialSources(options))[0]).toMatchObject({title:'Официальное название акта',effectiveDate:'2026-01-01',editionVerified:false});
  });
  it('does not replace a quote mismatch with provider evidence even after open_page',async()=>{
    jest.spyOn(global,'fetch').mockImplementation(async url=>String(url).endsWith('/responses')
      ? new Response(JSON.stringify({output_text:JSON.stringify({citations:[citation]}),output:[{type:'web_search_call',status:'completed',action:{type:'open_page',url:citation.url}}]}))
      : new Response('Другой официальный текст',{headers:{'content-type':'text/html'}}));
    expect(await recoverOfficialSources(options)).toEqual([]);
  });
  it('uses completed provider page retrieval when the direct publisher endpoint is unavailable',async()=>{
    jest.spyOn(global,'fetch').mockImplementation(async url=>String(url).endsWith('/responses')
      ? new Response(JSON.stringify({output_text:JSON.stringify({citations:[citation]}),output:[{type:'web_search_call',status:'completed',action:{type:'open_page',url:citation.url}}]}))
      : new Response('',{status:503}));
    expect((await recoverOfficialSources(options))[0]).toMatchObject({verificationMethod:'openai_web_search'});
  });
  it('does not override an unsafe publisher redirect with provider evidence',async()=>{
    const fetch=jest.spyOn(global,'fetch').mockImplementation(async url=>String(url).endsWith('/responses')
      ? new Response(JSON.stringify({output_text:JSON.stringify({citations:[citation]}),output:[{type:'web_search_call',status:'completed',action:{type:'open_page',url:citation.url}}]}))
      : new Response(null,{status:302,headers:{location:'https://example.com/untrusted'}}));
    expect(await recoverOfficialSources(options)).toEqual([]);
    expect(fetch.mock.calls.some(call=>String(call[0]).includes('example.com'))).toBe(false);
  });
  it('does not accept an unsearched unsupported source without open_page',async()=>{
    mock({...citation,url:'https://gov.kz/legal.pdf'});
    jest.spyOn(global,'fetch').mockImplementation(async url=>String(url).endsWith('/responses')
      ? new Response(JSON.stringify({output_text:JSON.stringify({citations:[{...citation,url:'https://gov.kz/legal.pdf'}]}),output:[{action:{sources:[{url:'https://gov.kz/legal.pdf'}]}}]}))
      : new Response('PDF',{headers:{'content-type':'application/pdf'}}));
    expect(await recoverOfficialSources(options)).toEqual([]);
  });
});
