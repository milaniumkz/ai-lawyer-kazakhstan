import { NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { TemplatesService } from './templates.service';
import { GenerationJobsService } from './generation-jobs.service';

const input={templateId:'tpl-pretrial-claim-ru-v1',caseId:'case-1',fields:{claimantName:'Test owner',respondentName:'Test recipient',claimAmount:'1000',claimReason:'Synthetic test',deadlineDate:'To be confirmed'}};
describe('Document generation jobs',()=> {
  const db={} as DatabaseService;
  it('deduplicates retries and persists one editable result',async()=> {
    const templates=new TemplatesService(); const jobs=new GenerationJobsService(templates,db);
    const first=await jobs.enqueue(input,'owner','same-input');
    expect((await jobs.enqueue(input,'owner','same-input')).id).toBe(first.id);
    await jobs.processNext();
    const completed=await jobs.get(first.id,'owner');
    expect(completed.status).toBe('completed');
    expect(completed.document?.id).toBe(first.id);
    expect(await templates.listGenerated('case-1')).toHaveLength(1);
    await templates.editGenerated(first.id,'Edited draft','owner');
    expect((await templates.getGenerated(first.id,'owner')).body).toBe('Edited draft');
    expect((await jobs.get(first.id,'owner')).document?.body).toBe('Edited draft');
    expect((await templates.getGenerated(first.id,'owner')).expertReviewRequired).toBe(true);
    await expect(jobs.get(first.id,'other')).rejects.toThrow(NotFoundException);
    await expect(jobs.enqueue({...input,fields:{...input.fields,claimAmount:'2000'}},'owner','same-input')).rejects.toThrow('IDEMPOTENCY_INPUT_MISMATCH');
  });
  it('does not create a result for a cancelled queued job',async()=> {
    const templates=new TemplatesService(); const jobs=new GenerationJobsService(templates,db);
    const job=await jobs.enqueue(input,'owner','cancel');
    await jobs.cancel(job.id,'owner'); await jobs.processNext();
    expect((await jobs.get(job.id,'owner')).status).toBe('cancelled');
    expect(await templates.listGenerated('case-1')).toHaveLength(0);
  });
  it('cancellation during rendering wins and cannot store a result',async()=> {
    const templates=new TemplatesService(); const jobs=new GenerationJobsService(templates,db);
    const job=await jobs.enqueue(input,'owner','cancel-running');
    const document=await templates.buildDocument(input);
    let finish!: (value: typeof document)=>void;
    jest.spyOn(templates,'buildDocument').mockImplementation(()=>new Promise(resolve=> {finish=resolve;}));
    const processing=jobs.processNext();
    await jobs.cancel(job.id,'owner'); finish(document); await processing;
    expect((await jobs.get(job.id,'owner')).status).toBe('cancelled');
    expect(await templates.listGenerated('case-1')).toHaveLength(0);
  });
});
