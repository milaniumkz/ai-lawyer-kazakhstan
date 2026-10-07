import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PDFDocument } from 'pdf-lib';
import * as fontkit from '@pdf-lib/fontkit';

export async function createDocumentPdf(body: string) {
  const pdf=await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const bytes=await readFile(resolve(process.cwd(),'../../apps/web/public/fonts/LiberationSerif-Regular.ttf'));
  const font=await pdf.embedFont(bytes,{subset:true});
  let page=pdf.addPage([595.28,841.89]); let y=790;
  const draw=(line:string) => {if(y<50) {page=pdf.addPage([595.28,841.89]);y=790;} page.drawText(line,{x:48,y,size:12,font}); y-=18;};
  for(const paragraph of body.replace(/\r/g,'').split('\n')) {
    let line='';
    for(const character of Array.from(paragraph).filter(character => character.codePointAt(0)! >= 32 || character === '\t')) {
      if(font.widthOfTextAtSize(line+character,12)>499 && line) {draw(line);line='';}
      line+=character === "\t" ? "    " : character;
    }
    draw(line);
  }
  pdf.setTitle('Document draft'); pdf.setCreator('AIZAN');
  return Buffer.from(await pdf.save());
}
