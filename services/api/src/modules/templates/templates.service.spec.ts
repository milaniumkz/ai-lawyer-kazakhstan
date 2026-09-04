import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { CasesService } from '../cases/cases.service';
import { TemplatesService } from './templates.service';
import { TemplatesRepository } from './repositories/templates.repository';

describe('TemplatesService', () => {
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
    listGenerated: jest.fn().mockResolvedValue([]),
  };
}
