import { BadRequestException } from '@nestjs/common';
import { TemplatesService } from './templates.service';

describe('TemplatesService', () => {
  it('generates pretrial claim draft requiring confirmation and expert review', () => {
    const service = new TemplatesService();
    const [template] = service.listTemplates();
    const document = service.generate({
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

  it('rejects missing required fields', () => {
    const service = new TemplatesService();
    const [template] = service.listTemplates();

    expect(() => service.generate({ templateId: template.id, caseId: 'case-1', fields: {} })).toThrow(BadRequestException);
  });
});
