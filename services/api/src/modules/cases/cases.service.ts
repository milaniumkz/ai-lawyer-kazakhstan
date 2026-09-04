import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ChatProgressStatus, LegalCaseRecord, MessageRecord, TranscriptJob } from './cases.types';

const PROGRESS: ChatProgressStatus[] = ['transcribing', 'classifying', 'retrieving_sources', 'validating', 'generating', 'ready'];

@Injectable()
export class CasesService {
  private readonly cases = new Map<string, LegalCaseRecord>();
  private readonly messages = new Map<string, MessageRecord[]>();
  private readonly transcripts = new Map<string, TranscriptJob>();
  private readonly idempotency = new Map<string, LegalCaseRecord>();

  createCase(input: { ownerUserId: string; profileId?: string; problemText: string }, idempotencyKey?: string) {
    if (!input.ownerUserId) throw new BadRequestException('OWNER_REQUIRED');
    if (!input.problemText || input.problemText.trim().length < 10) throw new BadRequestException('PROBLEM_TEXT_TOO_SHORT');
    if (idempotencyKey && this.idempotency.has(idempotencyKey)) {
      return this.idempotency.get(idempotencyKey)!;
    }

    const classification = classifyProblem(input.problemText);
    const record: LegalCaseRecord = {
      id: randomUUID(),
      ownerUserId: input.ownerUserId,
      profileId: input.profileId,
      title: makeTitle(input.problemText),
      problemText: input.problemText,
      category: classification.category,
      subcategory: classification.subcategory,
      confidence: classification.confidence,
      status: classification.confidence < 0.65 ? 'clarification_required' : 'consultation',
      readinessPercent: 17,
      createdAt: new Date().toISOString(),
    };
    this.cases.set(record.id, record);
    this.messages.set(record.id, [
      {
        id: randomUUID(),
        caseId: record.id,
        role: 'system',
        text: 'AI может ошибаться. Юридически значимые действия требуют проверки и подтверждения.',
        createdAt: new Date().toISOString(),
      },
    ]);
    if (idempotencyKey) this.idempotency.set(idempotencyKey, record);
    return record;
  }

  listCases(ownerUserId: string) {
    return [...this.cases.values()].filter((item) => item.ownerUserId === ownerUserId);
  }

  getCase(caseId: string) {
    const record = this.cases.get(caseId);
    if (!record) throw new NotFoundException('CASE_NOT_FOUND');
    return record;
  }

  addMessage(caseId: string, input: { role: 'user' | 'assistant'; text: string }) {
    this.getCase(caseId);
    if (!input.text) throw new BadRequestException('MESSAGE_TEXT_REQUIRED');
    const message: MessageRecord = { id: randomUUID(), caseId, role: input.role, text: input.text, createdAt: new Date().toISOString() };
    const list = this.messages.get(caseId) ?? [];
    list.push(message);
    if (input.role === 'user') {
      list.push({
        id: randomUUID(),
        caseId,
        role: 'assistant',
        text: 'Принято. Для юридически точного ответа нужны подтвержденные официальные источники РК или проверка экспертом.',
        createdAt: new Date().toISOString(),
      });
    }
    this.messages.set(caseId, list);
    return message;
  }

  listMessages(caseId: string) {
    this.getCase(caseId);
    return this.messages.get(caseId) ?? [];
  }

  createTranscript(input: { caseId?: string; language?: 'ru' | 'kk' | 'en'; audioRef?: string; text?: string }) {
    const transcript = input.text?.trim() || 'Пользователь описал юридическую проблему голосом. Требуется подтверждение текста.';
    const job: TranscriptJob = {
      id: randomUUID(),
      caseId: input.caseId,
      status: 'ready',
      language: input.language ?? 'ru',
      transcript,
      lowConfidenceFragments: transcript.includes('неразборчиво') ? ['неразборчиво'] : [],
      createdAt: new Date().toISOString(),
    };
    this.transcripts.set(job.id, job);
    return { ...job, progress: PROGRESS };
  }

  getTranscript(id: string) {
    const job = this.transcripts.get(id);
    if (!job) throw new NotFoundException('TRANSCRIPT_NOT_FOUND');
    return job;
  }
}

export function classifyProblem(text: string) {
  const normalized = text.toLowerCase();
  if (normalized.includes('алимент')) return { category: 'family', subcategory: 'alimony', confidence: 0.86 };
  if (normalized.includes('долг') || normalized.includes('задолж')) return { category: 'civil_contract', subcategory: 'debt_collection', confidence: 0.82 };
  if (normalized.includes('работ') || normalized.includes('зарплат')) return { category: 'labor', subcategory: 'salary', confidence: 0.78 };
  if (normalized.includes('жалоб') || normalized.includes('орган')) return { category: 'administrative', subcategory: 'state_body_complaint', confidence: 0.72 };
  return { category: 'clarification_required', subcategory: 'unknown', confidence: 0.48 };
}

function makeTitle(text: string) {
  const compact = text.trim().replace(/\s+/g, ' ');
  return compact.length > 48 ? `${compact.slice(0, 45)}...` : compact;
}
