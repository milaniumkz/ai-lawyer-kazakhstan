import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

// Run on the application server with its existing environment, using only
// synthetic records in memory. No database writes, dispatches or court filings.
const root = new URL(process.env.AIZAN_PROBE_APP_ROOT || '../../',import.meta.url);
const require = createRequire(import.meta.url);
const {generateOpenAiConversation} = require(fileURLToPath(new URL('services/api/dist/modules/legal/openai-conversation.adapter.js',root)));
const {createDocumentPdf} = require(fileURLToPath(new URL('services/api/dist/modules/templates/document-pdf.js',root)));
process.chdir(fileURLToPath(new URL('services/api/',root)));
assert(process.env.AI_API_KEY || process.env.OPENAI_API_KEY,'Existing OpenAI configuration required');
const facts={claimantName:'Синтетический истец QA',claimantContact:'Алматы, claimant@example.invalid',respondentName:'Синтетический ответчик QA',respondentContact:'Алматы, respondent@example.invalid',circumstances:'Заём 100000 тенге по расписке передан 12 января 2026, срок возврата 12 февраля 2026, основной долг не возвращён',eventDate:'2026-01-12',demands:'Вернуть основной долг 100000 тенге без процентов и неустойки',evidence:'Синтетическая расписка; копия претензии, подтверждение получения 2 сентября 2026',deadline:'До 30 сентября 2026'};
const previous={provider:'openai',model:'synthetic-fixture',facts,missingFields:[],citations:[],readyForDraft:false};
const history=state=>[{id:'summary',caseId:'synthetic-memory-only',role:'assistant',text:'Синтетические сведения для проверки, пользователь подтверждает резюме.',createdAt:'',ai:state},{id:'confirmation',caseId:'synthetic-memory-only',role:'user',text:'Подтверждаю. Все реквизиты верны. Подготовьте полный проект по действующим нормам Республики Казахстан.',createdAt:''}];
const actualFetch=globalThis.fetch;
let faultInjected=false;
globalThis.fetch=async(url,options)=>{
  if(!faultInjected && String(url).endsWith('/responses') && JSON.parse(options.body).text?.format?.name==='aizan_conversation') {
    faultInjected=true;
    return new Response('',{status:503});
  }
  return actualFetch(url,options);
};
let phase='pretrial-source-recovery';
try {
  const pretrial=await generateOpenAiConversation('Синтетическая проверка копии ранее направленной претензии по возврату займа.',history(previous));
  assert(faultInjected);
  assert.equal(pretrial.ai.sourceSearch,'web_fallback');
  assert.equal(pretrial.ai.readyForDraft,true,'Independent live web search must produce a verified pretrial draft');
  assert(pretrial.ai.citations.every(source=>source.checkedAt));
  assert(pretrial.ai.citations.some(source=>/гражданск\S*\s+кодекс/i.test(source.title) && !/процесс/i.test(source.title)),'A loan pretrial requires substantive Civil Code grounds, not procedural articles alone');
  console.log(JSON.stringify({phase,provider:pretrial.ai.provider,model:pretrial.ai.model,citations:pretrial.ai.citations.length,characters:pretrial.ai.draftBody.length,verificationMethods:pretrial.ai.citations.map(source=>source.verificationMethod || 'official_text'),editionReviewRequired:pretrial.ai.citations.some(source=>source.editionVerified===false),faultInjected}));
  globalThis.fetch=actualFetch;
  phase='court-intake';
  const intake=await generateOpenAiConversation('Синтетический спор о долге',[...history(previous).slice(0,1),{id:'pretrial',caseId:'synthetic-memory-only',role:'assistant',text:pretrial.text,createdAt:'',ai:pretrial.ai},{id:'court-request',caseId:'synthetic-memory-only',role:'user',text:'Хочу перейти к подготовке искового заявления в суд. Сначала уточните сведения о направлении претензии и результате.',createdAt:''}]);
  assert.equal(intake.ai.documentKind,'court_claim');
  assert.equal(intake.ai.readyForDraft,false);
  assert.equal(intake.ai.factsConfirmed,false);
  console.log(JSON.stringify({phase,missingFields:intake.ai.missingFields.length,newConfirmationRequired:true}));
  phase='court-document';
  const courtFacts={...facts,courtName:'Тестовый суд (синтетическая проверка)',courtAddress:'Тестовый адрес суда (синтетическая проверка)',claimantAddress:'Тестовый адрес истца в Алматы',claimantIdentifier:'Синтетический идентификатор 000000000000',respondentAddress:'Тестовый адрес ответчика в Алматы',respondentIdentifier:'Синтетический идентификатор 000000000000',claimValue:'100000 тенге, только основной долг',stateDuty:'Расчёт заявителя: 1000 тенге, 1% от 100000 тенге; оплата не выполнялась, применимость ставки необходимо сверить по нормам',pretrialDispatch:'Заказное письмо 1 сентября 2026, получено 2 сентября 2026, подтверждение получения имеется',pretrialOutcome:'После 30 сентября 2026 требования не исполнены, спор сохраняется',pretrialStatus:'unresolved'};
  const court=await generateOpenAiConversation('Синтетическая проверка проекта иска, не реальное обращение в суд.',history({...intake.ai,facts:courtFacts,missingFields:[],factsConfirmed:false}));
  console.log(JSON.stringify({phase:'court-validation',readyForDraft:court.ai.readyForDraft,documentKind:court.ai.documentKind,citations:court.ai.citations.map(source=>({title:source.title,article:source.article,verificationMethod:source.verificationMethod,editionVerified:source.editionVerified}))}));
  assert.equal(court.ai.documentKind,'court_claim');
  assert.equal(court.ai.readyForDraft,true,'Live court document must be composed after confirmation');
  assert(court.ai.citations.length && court.ai.citations.every(source=>source.checkedAt));
  assert(court.ai.citations.some(source=>/гражданск\S*\s+кодекс/i.test(source.title) && !/процесс/i.test(source.title)),'Court loan claim needs substantive grounds');
  assert(court.ai.citations.some(source=>/процессуальн/i.test(source.title)),'Court claim must also verify procedural sources');
  assert(/иск|суд/i.test(court.ai.draftBody));
  const pdf=await createDocumentPdf(court.ai.draftBody);
  assert.equal(Buffer.from(pdf).subarray(0,5).toString(),'%PDF-');
  console.log(JSON.stringify({phase,provider:court.ai.provider,citations:court.ai.citations.length,characters:court.ai.draftBody.length,verificationMethods:court.ai.citations.map(source=>source.verificationMethod || 'official_text'),editionReviewRequired:court.ai.citations.some(source=>source.editionVerified===false),pdfBytes:pdf.length,syntheticDataOnly:true,submitted:false}));
} catch(error) {
  console.error(JSON.stringify({phase,passed:false,code:error.response?.code || error.name,...(error.name==='AssertionError'?{reason:String(error.message).slice(0,300)}:{})}));
  process.exitCode=1;
} finally {globalThis.fetch=actualFetch;}
