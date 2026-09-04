import { BadRequestException } from '@nestjs/common';
import { CasesService } from './cases.service';
import { CasesRepository } from './repositories/cases.repository';

describe('CasesService', () => {
  it('creates a classified case idempotently', async () => {
    const service = new CasesService();
    const first = await service.createCase({ ownerUserId: 'u1', problemText: 'Нужно взыскать долг по договору займа' }, 'same-key');
    const second = await service.createCase({ ownerUserId: 'u1', problemText: 'Другой текст про алименты' }, 'same-key');

    expect(first.id).toBe(second?.id);
    expect(first.category).toBe('civil_contract');
    expect(await service.listCases('u1')).toHaveLength(1);
  });

  it('adds user message and safe assistant fallback', async () => {
    const service = new CasesService();
    const legalCase = await service.createCase({ ownerUserId: 'u1', problemText: 'Нужно взыскать долг по расписке' });
    await service.addMessage(legalCase.id, { role: 'user', text: 'Что делать дальше?' });

    const messages = await service.listMessages(legalCase.id);
    expect(messages.some((message) => message.text.includes('официальные источники РК'))).toBe(true);
  });

  it('creates ready transcript job with progress states', async () => {
    const service = new CasesService();
    const job = await service.createTranscript({ language: 'ru', text: 'Алименты, часть записи неразборчиво' });

    expect(job.status).toBe('ready');
    expect(job.progress).toContain('transcribing');
    expect(job.lowConfidenceFragments).toEqual(['неразборчиво']);
  });

  it('rejects too short problem text', async () => {
    const service = new CasesService();
    await expect(service.createCase({ ownerUserId: 'u1', problemText: 'мало' })).rejects.toThrow(BadRequestException);
  });

  it('uses configured repository for persistent case flow', async () => {
    const repository = createRepositoryMock();
    const service = new CasesService(repository);

    const legalCase = await service.createCase({ ownerUserId: 'u1', problemText: 'Нужно взыскать долг по расписке' }, 'idem-1');
    await service.addMessage(legalCase.id, { role: 'user', text: 'Что делать дальше?' });
    await service.createTranscript({ caseId: legalCase.id, language: 'ru', text: 'текст обращения' });

    expect(repository.findCaseByIdempotencyKey).toHaveBeenCalledWith('idem-1');
    expect(repository.createCase).toHaveBeenCalled();
    expect(repository.rememberIdempotencyKey).toHaveBeenCalledWith({ key: 'idem-1', ownerUserId: 'u1', caseId: 'case-1' });
    expect(repository.createMessage).toHaveBeenCalledTimes(3);
    expect(repository.createTranscript).toHaveBeenCalled();
  });
});

function createRepositoryMock(): jest.Mocked<CasesRepository> {
  const legalCase = {
    id: 'case-1',
    ownerUserId: 'u1',
    title: 'Нужно взыскать долг по расписке',
    problemText: 'Нужно взыскать долг по расписке',
    category: 'civil_contract',
    subcategory: 'debt_collection',
    confidence: 0.82,
    status: 'consultation' as const,
    readinessPercent: 17,
    createdAt: '2026-09-04T00:00:00.000Z',
  };
  return {
    createCase: jest.fn().mockResolvedValue(legalCase),
    findCaseById: jest.fn().mockResolvedValue(legalCase),
    listCases: jest.fn().mockResolvedValue([legalCase]),
    rememberIdempotencyKey: jest.fn().mockResolvedValue(undefined),
    findCaseByIdempotencyKey: jest.fn().mockResolvedValue(undefined),
    createMessage: jest.fn().mockImplementation((message) => Promise.resolve({ id: 'message-1', createdAt: '2026-09-04T00:00:00.000Z', ...message })),
    listMessages: jest.fn().mockResolvedValue([]),
    createTranscript: jest.fn().mockImplementation((job) => Promise.resolve({ id: 'transcript-1', createdAt: '2026-09-04T00:00:00.000Z', ...job })),
    findTranscriptById: jest.fn(),
  };
}
