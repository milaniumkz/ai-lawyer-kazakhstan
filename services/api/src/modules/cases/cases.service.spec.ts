import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { CASE_TAXONOMY } from './case-taxonomy';
import { CasesService, classifyProblem } from './cases.service';
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

  it('covers Kazakhstan judicial case taxonomy with deterministic criteria', () => {
    expect(CASE_TAXONOMY).toHaveLength(25);
    expect(classifyProblem('Нужно взыскать алименты на ребенка после развода').category).toBe('family');
    expect(classifyProblem('Хочу обжаловать постановление и штраф по КоАП за нарушение ПДД').category).toBe('administrative_offense');
    expect(classifyProblem('Акимат незаконно отказал в государственной услуге, нужно оспорить бездействие').category).toBe('administrative_public_law');
    expect(classifyProblem('Полиция возбудила уголовное дело, следователь вызывает как подозреваемого').category).toBe('criminal');
    expect(classifyProblem('Нотариус отказал оформить наследство после смерти отца').category).toBe('inheritance');
    expect(classifyProblem('Пришло налоговое уведомление от органа госдоходов, начислили НДС').category).toBe('tax_customs');
    expect(classifyProblem('Непонятная ситуация, нужна консультация').category).toBe('clarification_required');
  });

  it('adds user message and safe assistant fallback', async () => {
    const service = new CasesService();
    const legalCase = await service.createCase({ ownerUserId: 'u1', problemText: 'Нужно взыскать долг по расписке' });
    await service.addMessage(legalCase.id, { role: 'user', text: 'Что делать дальше?' }, 'u1');

    const messages = await service.listMessages(legalCase.id, 'u1');
    expect(messages.some((message) => message.text.includes('официальные источники РК'))).toBe(true);
  });

  it('rejects case access for another owner', async () => {
    const service = new CasesService();
    const legalCase = await service.createCase({ ownerUserId: 'u1', problemText: 'Нужно взыскать долг по расписке' });

    await expect(service.getCase(legalCase.id, 'u2')).rejects.toThrow(ForbiddenException);
    await expect(service.addMessage(legalCase.id, { role: 'user', text: 'Что делать дальше?' }, 'u2')).rejects.toThrow(ForbiddenException);
  });

  it('creates ready transcript job with progress states', async () => {
    const service = new CasesService();
    const job = await service.createTranscript({ language: 'ru', text: 'Алименты, часть записи неразборчиво' }, 'u1');

    expect(job.ownerUserId).toBe('u1');
    expect(job.status).toBe('ready');
    expect(job.progress).toContain('transcribing');
    expect(job.lowConfidenceFragments).toEqual(['неразборчиво']);
  });

  it('stores uploaded audio metadata for transcript jobs', async () => {
    const uploadDir = await mkdtemp(join(tmpdir(), 'voice-upload-'));
    process.env.VOICE_UPLOAD_DIR = uploadDir;
    const service = new CasesService();
    const job = await service.createTranscriptFromAudio(
      { language: 'ru', text: 'Голосовое описание долга по расписке' },
      { originalname: 'voice.webm', mimetype: 'audio/webm;codecs=opus', size: 12, buffer: Buffer.from('real-audio') },
      'u1',
    );

    expect(job.ownerUserId).toBe('u1');
    expect(job.status).toBe('ready');
    expect(job.audioFileId).toBeDefined();
    expect(job.audioMimeType).toBe('audio/webm');
    expect(job.audioSha256).toHaveLength(64);
    await rm(uploadDir, { recursive: true, force: true });
    delete process.env.VOICE_UPLOAD_DIR;
  });

  it('rejects too short problem text', async () => {
    const service = new CasesService();
    await expect(service.createCase({ ownerUserId: 'u1', problemText: 'мало' })).rejects.toThrow(BadRequestException);
  });

  it('uses configured repository for persistent case flow', async () => {
    const repository = createRepositoryMock();
    const service = new CasesService(repository);

    const legalCase = await service.createCase({ ownerUserId: 'u1', problemText: 'Нужно взыскать долг по расписке' }, 'idem-1');
    await service.addMessage(legalCase.id, { role: 'user', text: 'Что делать дальше?' }, 'u1');
    await service.createTranscript({ caseId: legalCase.id, language: 'ru', text: 'текст обращения' }, 'u1');

    expect(repository.findCaseByIdempotencyKey).toHaveBeenCalledWith('idem-1');
    expect(repository.createCase).toHaveBeenCalled();
    expect(repository.rememberIdempotencyKey).toHaveBeenCalledWith({ key: 'idem-1', ownerUserId: 'u1', caseId: 'case-1' });
    expect(repository.createMessage).toHaveBeenCalledTimes(3);
    expect(repository.createTranscript).toHaveBeenCalledWith(expect.objectContaining({ ownerUserId: 'u1' }));
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
