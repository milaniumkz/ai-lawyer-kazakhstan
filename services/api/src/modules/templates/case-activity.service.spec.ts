import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { CasesService } from '../cases/cases.service';
import { TemplatesService } from './templates.service';
import { CaseActivityService } from './case-activity.service';
import { createDocumentPdf } from './document-pdf';
import { PDFDocument } from 'pdf-lib';

describe('User activity without providers',()=> {
  const cases={getCase:jest.fn().mockResolvedValue({})} as unknown as CasesService;
  const templates={getGenerated:jest.fn().mockResolvedValue({})} as unknown as TemplatesService;
  const create=()=>new CaseActivityService({} as DatabaseService,cases,templates);
  it('persists manual deadlines, validates calendar dates and isolates owner',async()=> {
    const service=create(); const task=await service.createTask({title:'Review synthetic draft',dueDate:'2026-10-15',caseId:'case-fixture'},'owner');
    expect(task.basis).toBe('user_defined');
    await expect(service.createTask({title:'Bad',dueDate:'2026-02-31'},'owner')).rejects.toThrow(BadRequestException);
    await expect(service.updateTask(task.id,'completed','other')).rejects.toThrow(NotFoundException);
    await service.updateTask(task.id,'completed','owner');expect((await service.listTasks('owner'))[0].status).toBe('completed');
    expect(await service.listTasks('other')).toHaveLength(0);await service.deleteTask(task.id,'owner');expect(await service.listTasks('owner')).toHaveLength(0);
  });
  it('requires valid contacts and explicit confirmation for unverified manual sending',async()=> {
    const service=create();
    await expect(service.createDispatch('document',{method:'email',contact:'bad'},'owner')).rejects.toThrow('RECIPIENT_INVALID');
    await expect(service.createDispatch('document',{method:'sms',contact:'-------'},'owner')).rejects.toThrow('RECIPIENT_INVALID');
    await expect(service.createDispatch('document',{method:'email',contact:'qa@example.invalid',status:'manual_sent_unverified'},'owner')).rejects.toThrow('MANUAL_SEND_CONFIRMATION_REQUIRED');
    const record=await service.createDispatch('document',{method:'email',contact:'qa@example.invalid',status:'manual_sent_unverified',confirmed:true},'owner');
    expect(record.status).toBe('manual_sent_unverified');expect(record.confirmedAt).toBeDefined();
    expect(await service.listDispatches('document','other')).toHaveLength(0);
  });
  it('stores support tickets and never fabricates a reply',async()=> {
    const service=create();await expect(service.createTicket({topic:'General',text:'short'},'owner')).rejects.toThrow(BadRequestException);
    const ticket=await service.createTicket({topic:'General',text:'Synthetic support question'},'owner');expect(ticket.status).toBe('open');
    expect(await service.listTickets('owner')).toHaveLength(1);expect(await service.listTickets('other')).toHaveLength(0);
    await service.replyTicket(ticket.id,{reply:'Actual staff reply',status:'resolved'});
    expect((await service.listTickets('owner'))[0]).toMatchObject({reply:'Actual staff reply',status:'resolved'});
    expect((await service.overview()).openTicketCount).toBe(0);
  });
  it('exports Cyrillic and Kazakh text with embedded font into multiple PDF pages',async()=> {
    const bytes=await createDocumentPdf(('Досудебная претензия. Қазақстан: Ә, Қ, Ғ, Ң, Ұ, Ү, Ө, Һ, І.\n').repeat(100));
    expect(bytes.subarray(0,5).toString()).toBe('%PDF-');
    const pdf=await PDFDocument.load(bytes);expect(pdf.getPageCount()).toBeGreaterThan(1);
  });
});
