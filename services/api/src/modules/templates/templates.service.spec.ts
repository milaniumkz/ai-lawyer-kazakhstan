import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { CasesService } from '../cases/cases.service';
import { TemplatesService } from './templates.service';
import { TemplatesRepository } from './repositories/templates.repository';

describe('TemplatesService', () => {
  it('saves a confirmed court draft with a court title and mandatory review', async () => {
    const message={id:'court-draft',role:'assistant',ai:{documentKind:'court_claim',readyForDraft:true,draftBody:'Исковое заявление в суд из подтверждённой переписки',missingFields:[],facts:{courtName:'Тестовый суд'},citations:[{title:'ГПК РК',article:'148',url:'https://adilet.zan.kz/rus/docs/test',effectiveDate:'2026-01-01'}]}};
    const cases={getCase:jest.fn().mockResolvedValue({id:'case-1'}),listMessages:jest.fn().mockResolvedValue([message])} as unknown as CasesService;
    const service=new TemplatesService(undefined,cases);
    const [template]=await service.listTemplates();
    const document=await service.generate({templateId:template.id,caseId:'case-1',fields:{chatDraftMessageId:'court-draft'}},'owner-1');
    expect(document).toMatchObject({title:'Исковое заявление в суд',expertReviewRequired:true,status:'draft_requires_user_confirmation'});
    expect(document.body).toContain(message.ai.draftBody);
  });
  it('marks independently unreadable or undated sources for review in the exported document', async () => {
    const message={id:'review-draft',role:'assistant',ai:{readyForDraft:true,draftBody:'Проект документа для проверки юристом',missingFields:[],facts:{},citations:[{title:'Официальная публикация',article:'1',url:'https://gov.kz/law.pdf',effectiveDate:'',verificationMethod:'openai_web_search',editionVerified:false}]}};
    const cases={getCase:jest.fn().mockResolvedValue({id:'case-1'}),listMessages:jest.fn().mockResolvedValue([message])} as unknown as CasesService;
    const service=new TemplatesService(undefined,cases);
    const [template]=await service.listTemplates();
    const document=await service.generate({templateId:template.id,caseId:'case-1',fields:{chatDraftMessageId:'review-draft'}},'owner-1');
    expect(document.status).toBe('review_required');
    expect(document.body).toContain('ПРОЕКТ ДЛЯ ОБЯЗАТЕЛЬНОЙ ПРОВЕРКИ ЮРИСТОМ');
    expect(document.body).toContain('редакция: требует проверки');
  });
  it('saves only the latest confirmed AI draft and rejects an outdated message', async () => {
    const message = { id:'ai-draft', role:'assistant', ai:{readyForDraft:true,draftBody:'Полный проект претензии из переписки',missingFields:[],citations:[{title:'ГК РК',article:'272',url:'https://adilet.zan.kz/rus/docs/test',effectiveDate:'2026-01-01'}]} };
    const cases = {getCase:jest.fn().mockResolvedValue({id:'case-1'}),listMessages:jest.fn().mockResolvedValue([message])} as unknown as CasesService;
    const service = new TemplatesService(undefined,cases);
    const [template]=await service.listTemplates();
    const input={templateId:template.id,caseId:'case-1',fields:{chatDraftMessageId:'ai-draft'}};
    const doc=await service.generate(input,'owner-1');
    expect(doc.body).toContain(message.ai.draftBody);
    expect(doc.body).toContain(message.ai.citations[0].url);
    expect(doc.expertReviewRequired).toBe(true);
    await expect(service.generate({...input,fields:{chatDraftMessageId:'outdated'}},'owner-1')).rejects.toThrow('CHAT_DRAFT_REQUIRES_CLARIFICATION');
    message.ai.readyForDraft=false;
    await expect(service.generate(input,'owner-1')).rejects.toThrow('CHAT_DRAFT_REQUIRES_CLARIFICATION');
  });
  it('generates pretrial claim draft requiring confirmation and expert review', async () => {
    const service = new TemplatesService();
    const [template] = await service.listTemplates();
    const document = await service.generate({
      templateId: template.id,
      caseId: 'case-1',
      fields: {
        claimantName: 'Иван Иванов',
        respondentName: 'ТОО Борышкер',
        claimAmount: '150000',
        claimReason: 'задолженность по договору',
        deadlineDate: '2026-09-20',
      },
    });

    expect(document.status).toBe('draft_requires_user_confirmation');
    expect(document.expertReviewRequired).toBe(true);
    expect(document.body).not.toContain('{{');
  });

  it('rejects missing required fields', async () => {
    const service = new TemplatesService();
    const [template] = await service.listTemplates();

    await expect(service.generate({ templateId: template.id, caseId: 'case-1', fields: {} })).rejects.toThrow(BadRequestException);
  });

  it('rejects a persisted header-only template instead of claiming a complete document', async () => {
    const repository = createRepositoryMock();
    const [template] = await repository.listTemplates();
    repository.findTemplateById.mockResolvedValue({ ...template, body: 'Проект документа. Требует проверки и подтверждения пользователем.' });
    const service = new TemplatesService(repository);
    await expect(service.generate({ templateId: template.id, caseId: 'case-1', fields: { claimantName: 'Заявитель', respondentName: 'Ответчик', claimAmount: '100000', claimReason: 'Долг', deadlineDate: 'Уточняется' } })).rejects.toThrow('Шаблон не содержит обязательные поля документа');
    expect(repository.createGeneratedDocument).not.toHaveBeenCalled();
  });

  it('checks case ownership when owner header is provided', async () => {
    const cases = { getCase: jest.fn().mockRejectedValue(new ForbiddenException('CASE_ACCESS_DENIED')) } as unknown as CasesService;
    const service = new TemplatesService(undefined, cases);

    await expect(
      service.generate(
        {
          templateId: 'tpl-pretrial-claim-ru-v1',
          caseId: 'case-1',
          fields: {
            claimantName: 'Иван Иванов',
            respondentName: 'ТОО Борышкер',
            claimAmount: '150000',
            claimReason: 'задолженность по договору',
            deadlineDate: '2026-09-20',
          },
        },
        'other-user',
      ),
    ).rejects.toThrow(ForbiddenException);
    expect(cases.getCase).toHaveBeenCalledWith('case-1', 'other-user');
  });

  it('uses configured repository for persistent generated documents', async () => {
    const repository = createRepositoryMock();
    const service = new TemplatesService(repository);

    const document = await service.generate({
      templateId: 'tpl-pretrial-claim-ru-v1',
      caseId: 'case-1',
      fields: {
        claimantName: 'Иван Иванов',
        respondentName: 'ТОО Борышкер',
        claimAmount: '150000',
        claimReason: 'задолженность по договору',
        deadlineDate: '2026-09-20',
      },
    });

    expect(document.id).toBe('generated-1');
    expect(repository.findTemplateById).toHaveBeenCalledWith('tpl-pretrial-claim-ru-v1');
    expect(repository.createGeneratedDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        templateId: 'tpl-pretrial-claim-ru-v1',
        status: 'draft_requires_user_confirmation',
        expertReviewRequired: true,
      }),
    );
  });
});

function createRepositoryMock(): jest.Mocked<TemplatesRepository> {
  const template = {
    id: 'tpl-pretrial-claim-ru-v1',
    code: 'pretrial_claim',
    title: 'Досудебная претензия',
    language: 'ru' as const,
    status: 'expert_review' as const,
    version: 'v1',
    requiredFields: ['claimantName', 'respondentName', 'claimAmount', 'claimReason', 'deadlineDate'],
    body: 'От: {{claimantName}}\nКому: {{respondentName}}\n{{claimReason}} {{claimAmount}} {{deadlineDate}}',
  };
  return {
    listTemplates: jest.fn().mockResolvedValue([template]),
    findTemplateById: jest.fn().mockResolvedValue(template),
    createGeneratedDocument: jest.fn().mockImplementation((document) =>
      Promise.resolve({
        ...document,
        id: 'generated-1',
        createdAt: '2026-09-04T00:00:00.000Z',
      }),
    ),
    findGenerated: jest.fn(),
    updateGenerated: jest.fn(),
    listGenerated: jest.fn().mockResolvedValue([]),
  };
}
