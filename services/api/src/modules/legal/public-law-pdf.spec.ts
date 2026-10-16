import {createDocumentPdf} from '../templates/document-pdf';
import {verifyOfficialQuote} from './official-sources';
import {extractPublicLawPdf} from './public-law-pdf';

describe('public official legal PDF text',()=>{
  afterEach(()=>jest.restoreAllMocks());
  it('extracts a real Cyrillic PDF and independently verifies a matching official quote',async()=>{
    const quote='Синтетическая норма: заемщик обязан вернуть сумму займа в установленный срок.';
    const bytes=await createDocumentPdf(quote);
    const fetch=jest.spyOn(global,'fetch').mockResolvedValue(new Response(new Uint8Array(bytes),{headers:{'content-type':'application/pdf'}}));
    const url='https://www.gov.kz/uploads/legal-reference.pdf';
    expect(await verifyOfficialQuote(url,quote,new Map())).toBe(url);
    expect(await verifyOfficialQuote(url,'Другой текст официальной нормы, который отсутствует в этом файле.',new Map())).toBeUndefined();
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it('does not fetch user uploads or run the PDF reader for invalid and oversized bytes',async()=>{
    const fetch=jest.spyOn(global,'fetch');
    expect(await verifyOfficialQuote('https://example.invalid/api/v1/files/private','Текст частного документа',new Map())).toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
    expect(await extractPublicLawPdf(Buffer.from('not a PDF'))).toBeUndefined();
    expect(await extractPublicLawPdf(Buffer.alloc(8*1024*1024+1))).toBeUndefined();
  });
});
