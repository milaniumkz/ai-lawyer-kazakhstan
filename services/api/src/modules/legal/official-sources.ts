import {readOfficialViewer} from './official-viewer';
import {fetchOfficialPublisher} from './publisher-trust';
export const officialDomains = ['adilet.zan.kz', 'zan.gov.kz', 'sud.gov.kz', 'gov.kz', 'egov.kz', 'akorda.kz', 'parlam.kz'];

export function isOfficialUrl(value: string) {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password && officialDomains.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`)); } catch { return false; }
}

export function canonicalUrl(value: string) {
  try { const url = new URL(value); if (!/^#!?\//.test(url.hash)) url.hash = ''; for(const key of [...url.searchParams.keys()]) if(/^utm_/i.test(key)||['gclid','fbclid'].includes(key)) url.searchParams.delete(key); return url.href; } catch { return ''; }
}

export function officialSourceIdentity(value:string) {
  try {
    const url=new URL(canonicalUrl(value));
    const act=url.pathname.match(/^\/(rus|kaz|eng|ru|kz|en)\/docs\/([A-Z][A-Z0-9_]{4,30})\/?$/);
    if(['adilet.zan.kz','old.adilet.zan.kz'].includes(url.hostname) && !url.search && act) {
      const language=({ru:'rus',kz:'kaz',en:'eng'} as Record<string,string>)[act[1]] || act[1];
      return `adilet:${language}:${act[2]}`;
    }
    return canonicalUrl(value);
  } catch { return ''; }
}

function normalizeQuote(value: string) { return value.toLocaleLowerCase().replace(/ё/g,'е').replace(/[«»"“”]/g,'').replace(/[–—]/g,'-').replace(/\s+/g,' ').trim(); }

export type OfficialPage = {text:string;url:string;unavailable?:'transport'|'pdf';editionDate?:string};

export async function verifyOfficialQuote(url: string, quote: string, cache: Map<string,Promise<OfficialPage|undefined>>): Promise<string|undefined> {
  const candidates = [canonicalUrl(url)];
  const parsed = new URL(url);
  if (parsed.hostname === 'adilet.zan.kz' && /^\/(rus|kaz|eng|ru|kz|en)\/docs\/[A-Z][A-Z0-9_]{4,30}\/?$/.test(parsed.pathname) && !parsed.search) {
    parsed.hostname = 'old.adilet.zan.kz';
    parsed.pathname = parsed.pathname.replace(/^\/(ru|kz|en)\//, (_, language: string) => `/${({ru:'rus',kz:'kaz',en:'eng'} as Record<string,string>)[language]}/`);
    candidates.push(parsed.href);
  }
  for (const key of candidates) {
    if(!cache.has(key)) cache.set(key,readOfficialText(key));
    const page = await cache.get(key);
    if (page?.text.includes(normalizeQuote(quote))) return page.url;
  }
  return undefined;
}

export async function readOfficialText(url: string): Promise<OfficialPage|undefined> {
  try {
    if (!isOfficialUrl(url)) return undefined;
    const viewer = await readOfficialViewer(url,normalizeHtml);
    if (viewer) return viewer;
    let currentUrl = url;
    for (let redirects = 0; redirects < 3; redirects++) {
      if (!isOfficialUrl(currentUrl)) return undefined;
      const response = await fetchOfficialPublisher(currentUrl, { redirect: 'manual', signal: AbortSignal.timeout(10000) });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) return undefined;
        currentUrl = new URL(location, currentUrl).href;
        continue;
      }
      if (!response.ok) {
        if (response.status === 403 || response.status === 429 || response.status >= 500) return {text:'',url:currentUrl,unavailable:'transport'};
        return undefined;
      }
      if (/application\/pdf/i.test(response.headers.get('content-type') || '')) {await response.body?.cancel(); return {text:'',url:currentUrl,unavailable:'pdf'};}
      if (!response.body || !/text\/(html|plain)/i.test(response.headers.get('content-type') || '')) return undefined;
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      for (;;) {
        const chunk = await reader.read();
        if (chunk.done) break;
        size += chunk.value.length;
        if (size > 8 * 1024 * 1024) { await reader.cancel(); return undefined; }
        chunks.push(chunk.value);
      }
      const html = Buffer.concat(chunks).toString('utf8');
      const normalized = normalizeHtml(html);
      const parsedUrl = new URL(currentUrl);
      // The publisher's new viewer is a JS shell. Its own public client exposes
      // old.adilet.zan.kz as the official legacy viewer for the same registered act.
      const act = parsedUrl.pathname.match(/^\/(rus|kaz|eng|ru|kz|en)\/docs\/([A-Z][A-Z0-9_]{4,30})\/?$/);
      if (parsedUrl.hostname === 'adilet.zan.kz' && !parsedUrl.search && act && /включите javascript|enable javascript/i.test(normalized)) {
        const language = ({ru:'rus',kz:'kaz',en:'eng'} as Record<string,string>)[act[1]] || act[1];
        return readOfficialText(`https://old.adilet.zan.kz/${language}/docs/${act[2]}`);
      }
      return {text:normalized,url:currentUrl};
    }
    return undefined;
  } catch { return {text:'',url,unavailable:'transport'}; }
}

function normalizeHtml(html:string) {
  const text = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ').replace(/<\/?(?:p|div|h[1-6]|li|tr|td|section|article|br)\b[^>]*>/gi,' ').replace(/<[^>]+>/g, '').replace(/&(?:nbsp|#160);/g,' ').replace(/&amp;/g,'&').replace(/&(?:quot|laquo|raquo);/g,'"').replace(/&ndash;/g,'-').replace(/&mdash;/g,'-').replace(/&shy;|\u00ad/g,'');
  return normalizeQuote(text);
}
