import {fetchOfficialPublisher} from './publisher-trust';

// Read-only public catalogue search. Only legal act titles go to the publisher;
// no party names, contacts, account cookies or OpenAI credentials are forwarded.
export async function searchOfficialCatalogue(titles:unknown,signal:AbortSignal):Promise<string[]> {
  if(!Array.isArray(titles))return [];
  const queries=[...new Set(titles.filter((title):title is string=>typeof title==='string' && title.length>=5 && title.length<=180 && (/кодекс|закон|конституци|нормативн.*постановлен|постановлен.*суд|правил|бұйрық|заң|қаулы/i.test(title) || /^об?\s+/i.test(title)) && (title.match(/\d/g) || []).length<7 && /^[\p{L}\p{N}\s()«»",.—-]+$/u.test(title)).map(title=>title.trim().replace(/^(?:Закон|Кодекс)\s+(?:Республики\s+Казахстан|РК)\s*/i,'').replace(/Республики\s+Казахстан/gi,'').replace(/(?:^|\s)РК(?=\s|$)/gi,' ').replace(/^(?:Закон|Кодекс)\s+/i,'').replace(/^[«"]|[»"]$/g,'').replace(/\s+/g,' ').trim()).filter(title=>title.length>=5))].slice(0,3);
  const results=await Promise.all(queries.map(async search=>{
    try {
      const response=await fetchOfficialPublisher('https://zan.gov.kz/api/documents/search',{
        method:'POST',headers:{'Content-Type':'application/json'},redirect:'manual',
        signal:AbortSignal.any([signal,AbortSignal.timeout(12000)]),
        // Keep parenthetical part qualifiers out of the catalogue query; rank
        // the returned acts against the complete requested title below.
        body:JSON.stringify({search:search.replace(/\([^)]*\)/g,' ').replace(/\s+/g,' ').trim(),searchExclude:/внесени/i.test(search) ? '' : 'внесении',language:'rus',page:1,limit:10}),
      });
      if(!response.ok || !response.body)return [];
      const reader=response.body.getReader();const chunks:Uint8Array[]=[];let size=0;
      for(;;){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>1024*1024){await reader.cancel();return [];}chunks.push(part.value);}
      const body=JSON.parse(Buffer.concat(chunks).toString('utf8')) as {list?:Array<{code?:string;status?:string;summary?:{rus?:string}}>};
      const normalize=(text:string)=>text.toLocaleLowerCase().replace(/ё/g,'е').replace(/республики\s+казахстан/g,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
      const phrase=normalize(search);
      const words=phrase.match(/[а-яәғқңөұүһі]{4,}/g) || [];
      return (Array.isArray(body.list)?body.list:[])
        .filter(row=>/^\d{1,12}$/.test(String(row.code)) && row.status==='new' && typeof row.summary?.rus==='string')
        .map(row=>{
          const title=normalize(row.summary!.rus!);
          const matched=words.filter(word=>title.includes(word)).length;
          return {url:`https://zan.gov.kz/client/#!/doc/${row.code}/rus`,matched,
            score:(title===phrase ? 1000 : title.includes(phrase) ? 500 : 0)+matched-( /^о\s+(?:введении|ратификации)/i.test(row.summary!.rus!) && !/^о\s+(?:введении|ратификации)/i.test(search)?10:0)};
        })
        .filter(row=>row.score>0 && row.matched>=Math.max(1,Math.ceil(words.length*0.75))).sort((a,b)=>b.score-a.score).slice(0,1).map(row=>row.url);
    }catch{return [];}
  }));
  return [...new Set(results.flat())].slice(0,3);
}
