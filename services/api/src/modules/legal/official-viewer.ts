import {fetchOfficialPublisher} from './publisher-trust';
import type {OfficialPage} from './official-sources';

export async function readOfficialViewer(url:string,normalize:(html:string)=>string):Promise<OfficialPage|undefined> {
  const parsed=new URL(url);
  if (parsed.protocol!=='https:' || parsed.username || parsed.password || (parsed.port && parsed.port!=='443') || !['law.gov.kz','zan.gov.kz'].includes(parsed.hostname)) return undefined;
  const route=/^\/client\/?$/.test(parsed.pathname) ? parsed.hash.match(/^#!?\/doc\/(\d{1,12})\/(rus|kaz|eng)(?:\/(\d{2}\.\d{2}\.\d{4}))?(?:\/\d+(?:\/\d+)?)?$/) : parsed.pathname.match(/^\/api\/documents\/(\d{1,12})\/(rus|kaz|eng)(?:\/(\d{2}\.\d{2}\.\d{4}))?\/?$/);
  if (!route) return undefined;
  const [,code,language,version]=route;
  const signal=AbortSignal.timeout(20000);
  let pages=1,size=0,editionDate='',title='';
  const chunks:string[]=[];
  try {
    for(let page=1;page<=pages;page++) {
      const endpoint=new URL(`/api/documents/${code}/${language}${version ? '/'+version : ''}`,parsed.origin);
      endpoint.searchParams.set('withHtml','true');endpoint.searchParams.set('page',String(page));
      const response=await fetchOfficialPublisher(endpoint.href,{redirect:'manual',signal});
      if ([403,429].includes(response.status) || response.status>=500) return {text:'',url,unavailable:'transport'};
      if (!response.ok || !/application\/json/i.test(response.headers.get('content-type') || '') || !response.body) return undefined;
      const reader=response.body.getReader();const buffers:Uint8Array[]=[];
      for(;;) {const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>8*1024*1024){await reader.cancel();return undefined;}buffers.push(part.value);}
      const body=JSON.parse(Buffer.concat(buffers).toString('utf8')) as {id?:string|number;code?:string|number;language?:string;content?:string;pagesCount?:number;versionDate?:string;actualVersion?:boolean;metadata?:{title?:Record<string,string>}};
      if (![String(body.code),String(body.id)].includes(code) || body.language!==language || typeof body.content!=='string' || !Number.isInteger(body.pagesCount) || body.pagesCount!<1 || body.pagesCount!>200 || (!version && body.actualVersion!==true)) return undefined;
      if(page===1){title=body.metadata?.title?.[language] || '';pages=body.pagesCount!;editionDate=typeof body.versionDate==='string' && /^\d{4}-\d{2}-\d{2}$/.test(body.versionDate) && Date.parse(body.versionDate)<=Date.now() ? body.versionDate : '';}
      else if(body.pagesCount!==pages || body.versionDate!==editionDate) return undefined;
      if(version && editionDate!==version.split('.').reverse().join('-')) return undefined;
      chunks.push(body.content);
    }
    return {url,text:normalize(chunks.join('\n')), ...(editionDate ? {editionDate} : {}),...(title ? {title} : {})};
  } catch {return {text:'',url,unavailable:'transport'};}
}
