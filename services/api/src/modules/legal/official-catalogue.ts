import {fetchOfficialPublisher} from './publisher-trust';

// Read-only public catalogue search. Only legal act titles go to the publisher;
// no party names, contacts, account cookies or OpenAI credentials are forwarded.
export async function searchOfficialCatalogue(titles:unknown,signal:AbortSignal):Promise<string[]> {
  if(!Array.isArray(titles))return [];
  const queries=[...new Set(titles.filter((title):title is string=>typeof title==='string' && title.length>=5 && title.length<=180 && (/кодекс|закон|конституци|нормативн.*постановлен|постановлен.*суд|правил|бұйрық|заң|қаулы/i.test(title) || /^об?\s+/i.test(title)) && (title.match(/\d/g) || []).length<7 && /^[\p{L}\p{N}\s()«»",.—-]+$/u.test(title)).map(title=>title.trim().replace(/^(?:Закон|Кодекс)\s+(?:Республики\s+Казахстан|РК)\s*/i,'').replace(/^[«"]|[»"]$/g,'').trim()).filter(title=>title.length>=5))].slice(0,3);
  const results=await Promise.all(queries.map(async search=>{
    try {
      const response=await fetchOfficialPublisher('https://zan.gov.kz/api/documents/search',{
        method:'POST',headers:{'Content-Type':'application/json'},redirect:'manual',
        signal:AbortSignal.any([signal,AbortSignal.timeout(12000)]),
        body:JSON.stringify({search,searchExclude:/внесени/i.test(search) ? '' : 'внесении',language:'rus',page:1,limit:10}),
      });
      if(!response.ok || !response.body)return [];
      const reader=response.body.getReader();const chunks:Uint8Array[]=[];let size=0;
      for(;;){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>1024*1024){await reader.cancel();return [];}chunks.push(part.value);}
      const body=JSON.parse(Buffer.concat(chunks).toString('utf8')) as {list?:Array<{code?:string;status?:string;summary?:{rus?:string}}>};
      const words=search.toLocaleLowerCase().match(/[а-яәғқңөұүһі]{4,}/g) || [];
      return (Array.isArray(body.list)?body.list:[])
        .filter(row=>/^\d{1,12}$/.test(String(row.code)) && row.status==='new' && typeof row.summary?.rus==='string')
        .map(row=>({url:`https://zan.gov.kz/client/#!/doc/${row.code}/rus`,score:words.reduce((n,word)=>n+(row.summary!.rus!.toLocaleLowerCase().includes(word)?1:0),0)-( /^о\s+(?:введении|ратификации)/i.test(row.summary!.rus!) && !/^о\s+(?:введении|ратификации)/i.test(search)?10:0)}))
        .filter(row=>row.score>0).sort((a,b)=>b.score-a.score).slice(0,1).map(row=>row.url);
    }catch{return [];}
  }));
  return [...new Set(results.flat())].slice(0,3);
}
