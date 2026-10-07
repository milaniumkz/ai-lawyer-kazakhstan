const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const {NestFactory}=require('@nestjs/core');
const {AppModule}=require('../../services/api/dist/modules/app.module');
const {DatabaseService}=require('../../services/api/dist/common/database/database.service');
const {GenerationJobsService}=require('../../services/api/dist/modules/templates/generation-jobs.service');
const {CasesService}=require('../../services/api/dist/modules/cases/cases.service');
const {CaseActivityService}=require('../../services/api/dist/modules/templates/case-activity.service');
const {TemplatesService}=require('../../services/api/dist/modules/templates/templates.service');
if(!process.env.DATABASE_URL || process.env.APP_ENV!=='test') throw Error('Use an isolated test database and APP_ENV=test');
process.chdir(require('node:path').resolve(__dirname,'../../services/api'));
let app,owner;
async function open(){const context=await NestFactory.createApplicationContext(AppModule,{logger:false});context.get(GenerationJobsService).onModuleDestroy();return context;}
(async()=>{
 try {
  app=await open();let db=app.get(DatabaseService);owner=randomUUID();
  await db.query("INSERT INTO users (id,email,roles,consent_version) VALUES ($1,$2,ARRAY['user'],'qa')",[owner,`durability-${owner}@example.invalid`]);
  const legalCase=await app.get(CasesService).createCase({ownerUserId:owner,problemText:'Синтетическая проверка восстановления документа'});
  const input={templateId:'tpl-pretrial-claim-ru-v2',caseId:legalCase.id,fields:{claimantName:'QA',respondentName:'QA recipient',claimAmount:'1000',claimReason:'Synthetic test only',deadlineDate:'To be confirmed'}};
  let jobs=app.get(GenerationJobsService);const queued=await jobs.enqueue(input,owner,'durability-1');
  assert.equal((await jobs.enqueue(input,owner,'durability-1')).id,queued.id);
  const cancelled=await jobs.enqueue(input,owner,'cancel-1');await jobs.cancel(cancelled.id,owner);
  // Persist an abandoned lease as if the process died mid-render.
  await db.query("UPDATE document_generation_jobs SET payload=payload || jsonb_build_object('status','running','lease','abandoned'),updated_at=now()-interval '65 seconds' WHERE id=$1",[queued.id]);
  await app.close();app=await open();jobs=app.get(GenerationJobsService);db=app.get(DatabaseService);
  await jobs.processNext();const restored=await jobs.get(queued.id,owner);assert.equal(restored.status,'completed');assert.equal(restored.document.id,queued.id);
  assert.equal((await jobs.get(cancelled.id,owner)).status,'cancelled');
  assert.equal((await app.get(TemplatesService).listGenerated(legalCase.id,owner)).length,1);
  await Promise.all([jobs.processNext(),jobs.processNext()]);
  assert.equal((await app.get(TemplatesService).listGenerated(legalCase.id,owner)).length,1);
  await app.get(TemplatesService).editGenerated(queued.id,'Изменённый текст пользователя. Қазақстан.',owner);
  const activity=app.get(CaseActivityService);
  const ticket=await activity.createTicket({topic:'QA',text:'Synthetic saved support question'},owner);
  await activity.replyTicket(ticket.id,{reply:'Real persisted staff answer',status:'resolved'});
  const overview=await activity.overview();assert.equal(typeof overview.caseCount,'number');
  await app.close();app=await open();
  assert.equal((await app.get(TemplatesService).getGenerated(queued.id,owner)).body,'Изменённый текст пользователя. Қазақстан.');
  assert((await app.get(CaseActivityService).listTickets(owner)).some(item=>item.id===ticket.id && item.reply==='Real persisted staff answer'));
  console.log('PostgreSQL durability passed: abandoned lease recovery after runtime restart, stable result ID, cancellation, no duplicate document, edited draft survives restart.');
 } finally {if(app){if(owner)await app.get(DatabaseService).query('DELETE FROM users WHERE id=$1',[owner]);await app.close();}}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
