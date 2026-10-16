import {spawn} from 'node:child_process';

// Called only after an HTTPS official-publisher URL and bounded PDF response
// have been verified. User uploads never enter this path or leave the server.
export async function extractPublicLawPdf(bytes:Buffer):Promise<string|undefined> {
  if(bytes.length>8*1024*1024 || bytes.subarray(0,5).toString()!=='%PDF-')return undefined;
  return new Promise(resolve=>{
    const child=spawn('pdftotext',['-enc','UTF-8','-nopgbrk','-','-'],{stdio:['pipe','pipe','ignore'],timeout:10000,killSignal:'SIGKILL'});
    const chunks:Buffer[]=[];let size=0,settled=false;
    const finish=(value?:string)=>{if(!settled){settled=true;resolve(value);}};
    child.on('error',()=>finish());
    child.stdout.on('data',(chunk:Buffer)=>{size+=chunk.length;if(size>8*1024*1024){child.kill('SIGKILL');finish();}else chunks.push(chunk);});
    child.on('close',code=>finish(code===0 && size ? Buffer.concat(chunks).toString('utf8') : undefined));
    child.stdin.on('error',()=>finish());
    child.stdin.end(bytes);
  });
}
