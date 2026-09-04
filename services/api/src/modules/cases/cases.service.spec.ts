import { BadRequestException } from '@nestjs/common';
import { CasesService } from './cases.service';

describe('CasesService', () => {
  it('creates a classified case idempotently', () => {
    const service = new CasesService();
    const first = service.createCase({ ownerUserId: 'u1', problemText: 'Нужно взыскать долг по договору займа' }, 'same-key');
    const second = service.createCase({ ownerUserId: 'u1', problemText: 'Другой текст про алименты' }, 'same-key');

    expect(first.id).toBe(second?.id);
    expect(first.category).toBe('civil_contract');
    expect(service.listCases('u1')).toHaveLength(1);
  });

  it('adds user message and safe assistant fallback', () => {
    const service = new CasesService();
    const legalCase = service.createCase({ ownerUserId: 'u1', problemText: 'Нужно взыскать долг по расписке' });
    service.addMessage(legalCase.id, { role: 'user', text: 'Что делать дальше?' });

    const messages = service.listMessages(legalCase.id);
    expect(messages.some((message) => message.text.includes('официальные источники РК'))).toBe(true);
  });

  it('creates ready transcript job with progress states', () => {
    const service = new CasesService();
    const job = service.createTranscript({ language: 'ru', text: 'Алименты, часть записи неразборчиво' });

    expect(job.status).toBe('ready');
    expect(job.progress).toContain('transcribing');
    expect(job.lowConfidenceFragments).toEqual(['неразборчиво']);
  });

  it('rejects too short problem text', () => {
    const service = new CasesService();
    expect(() => service.createCase({ ownerUserId: 'u1', problemText: 'мало' })).toThrow(BadRequestException);
  });
});
