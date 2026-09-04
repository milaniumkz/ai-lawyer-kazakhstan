import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { ChatProgressStatus, LegalCaseRecord, MessageRecord, TranscriptJob } from './cases.types';
import { CASES_REPOSITORY } from './repositories/cases-repository.provider';
import { CasesRepository } from './repositories/cases.repository';

const PROGRESS: ChatProgressStatus[] = ['transcribing', 'classifying', 'retrieving_sources', 'validating', 'generating', 'ready'];
const ALLOWED_AUDIO_MIME_TYPES = new Set(['audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/wav', 'audio/x-wav']);

@Injectable()
export class CasesService {
  private readonly cases = new Map<string, LegalCaseRecord>();
  private readonly messages = new Map<string, MessageRecord[]>();
  private readonly transcripts = new Map<string, TranscriptJob>();
  private readonly idempotency = new Map<string, LegalCaseRecord>();

  constructor(@Optional() @Inject(CASES_REPOSITORY) private readonly repository?: CasesRepository) {}

  async createCase(input: { ownerUserId: string; profileId?: string; problemText: string }, idempotencyKey?: string) {
    if (!input.ownerUserId) throw new BadRequestException('OWNER_REQUIRED');
    if (!input.problemText || input.problemText.trim().length < 10) throw new BadRequestException('PROBLEM_TEXT_TOO_SHORT');
    if (this.repository && idempotencyKey) {
      const existing = await this.repository.findCaseByIdempotencyKey(idempotencyKey);
      if (existing) return existing;
    }
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
    const stored = this.repository ? await this.repository.createCase(record) : record;
    const systemMessage = {
      id: randomUUID(),
      caseId: stored.id,
      role: 'system' as const,
      text: 'AI может ошибаться. Юридически значимые действия требуют проверки и подтверждения.',
      createdAt: new Date().toISOString(),
    };
    if (this.repository) await this.repository.createMessage(systemMessage);
    else {
      this.cases.set(stored.id, stored);
      this.messages.set(stored.id, [systemMessage]);
      if (idempotencyKey) this.idempotency.set(idempotencyKey, stored);
    }
    if (this.repository && idempotencyKey) await this.repository.rememberIdempotencyKey({ key: idempotencyKey, ownerUserId: input.ownerUserId, caseId: stored.id });
    return stored;
  }

  async listCases(ownerUserId: string) {
    if (this.repository) return this.repository.listCases(ownerUserId);
    return [...this.cases.values()].filter((item) => item.ownerUserId === ownerUserId);
  }

  async getCase(caseId: string, ownerUserId?: string) {
    const record = this.repository ? await this.repository.findCaseById(caseId) : this.cases.get(caseId);
    if (!record) throw new NotFoundException('CASE_NOT_FOUND');
    if (ownerUserId !== undefined) {
      if (!ownerUserId) throw new ForbiddenException('USER_REQUIRED');
      if (record.ownerUserId !== ownerUserId) throw new ForbiddenException('CASE_ACCESS_DENIED');
    }
    return record;
  }

  async addMessage(caseId: string, input: { role: 'user' | 'assistant'; text: string }, ownerUserId?: string) {
    await this.getCase(caseId, ownerUserId);
    if (!input.text) throw new BadRequestException('MESSAGE_TEXT_REQUIRED');
    const message: MessageRecord = { id: randomUUID(), caseId, role: input.role, text: input.text, createdAt: new Date().toISOString() };
    if (this.repository) await this.repository.createMessage(message);
    const list = this.messages.get(caseId) ?? [];
    if (!this.repository) list.push(message);
    if (input.role === 'user') {
      const fallback = {
        id: randomUUID(),
        caseId,
        role: 'assistant',
        text: 'Принято. Для юридически точного ответа нужны подтвержденные официальные источники РК или проверка экспертом.',
        createdAt: new Date().toISOString(),
      } as const;
      if (this.repository) await this.repository.createMessage(fallback);
      else list.push(fallback);
    }
    if (!this.repository) this.messages.set(caseId, list);
    return message;
  }

  async listMessages(caseId: string, ownerUserId?: string) {
    await this.getCase(caseId, ownerUserId);
    if (this.repository) return this.repository.listMessages(caseId);
    return this.messages.get(caseId) ?? [];
  }

  async createTranscript(input: { caseId?: string; language?: 'ru' | 'kk' | 'en'; audioRef?: string; text?: string }, ownerUserId: string) {
    if (input.caseId) await this.getCase(input.caseId, ownerUserId);
    const transcript = input.text?.trim() || 'Пользователь описал юридическую проблему голосом. Требуется подтверждение текста.';
    const job: TranscriptJob = {
      id: randomUUID(),
      ownerUserId,
      caseId: input.caseId,
      status: 'ready',
      language: input.language ?? 'ru',
      transcript,
      lowConfidenceFragments: transcript.includes('неразборчиво') ? ['неразборчиво'] : [],
      createdAt: new Date().toISOString(),
    };
    const stored = this.repository ? await this.repository.createTranscript(job) : job;
    if (!this.repository) this.transcripts.set(job.id, job);
    return { ...stored, progress: PROGRESS };
  }

  async createTranscriptFromAudio(
    input: { caseId?: string; language?: 'ru' | 'kk' | 'en'; text?: string },
    file?: { originalname: string; mimetype: string; size: number; buffer: Buffer },
    ownerUserId?: string,
  ) {
    if (!ownerUserId) throw new ForbiddenException('USER_REQUIRED');
    if (input.caseId) await this.getCase(input.caseId, ownerUserId);
    if (!file?.buffer?.length) throw new BadRequestException('AUDIO_FILE_REQUIRED');
    const mimeType = normalizeAudioMimeType(file.mimetype);
    if (!ALLOWED_AUDIO_MIME_TYPES.has(mimeType)) throw new BadRequestException('AUDIO_MIME_TYPE_NOT_ALLOWED');

    const audioFileId = randomUUID();
    const audioSha256 = createHash('sha256').update(file.buffer).digest('hex');
    const storageDir = process.env.VOICE_UPLOAD_DIR ?? join(process.cwd(), 'storage', 'voice');
    const extension = safeAudioExtension(file.originalname, mimeType);
    const audioStorageKey = `${audioFileId}${extension}`;
    await mkdir(storageDir, { recursive: true });
    await writeFile(join(storageDir, audioStorageKey), file.buffer);

    const transcript = input.text?.trim() || 'Аудио сохранено. Расшифровка требует подключения STT-провайдера или ручного подтверждения текста.';
    const job: TranscriptJob = {
      id: randomUUID(),
      ownerUserId,
      caseId: input.caseId,
      status: input.text?.trim() ? 'ready' : 'review_required',
      language: input.language ?? 'ru',
      transcript,
      lowConfidenceFragments: input.text?.trim() ? [] : ['stt_provider_not_configured'],
      audioFileId,
      audioMimeType: mimeType,
      audioSizeBytes: file.size,
      audioSha256,
      audioStorageKey,
      createdAt: new Date().toISOString(),
    };
    const stored = this.repository ? await this.repository.createTranscript(job) : job;
    const result = { ...stored, audioFileId, audioMimeType: mimeType, audioSizeBytes: file.size, audioSha256, audioStorageKey, progress: PROGRESS };
    if (!this.repository) this.transcripts.set(job.id, result);
    return result;
  }

  async getTranscript(id: string, ownerUserId?: string) {
    const job = this.repository ? await this.repository.findTranscriptById(id) : this.transcripts.get(id);
    if (!job) throw new NotFoundException('TRANSCRIPT_NOT_FOUND');
    if (!ownerUserId) throw new ForbiddenException('USER_REQUIRED');
    if (job.ownerUserId !== ownerUserId) throw new ForbiddenException('TRANSCRIPT_ACCESS_DENIED');
    return job;
  }
}

function normalizeAudioMimeType(mimeType: string) {
  return mimeType.split(';')[0]?.trim().toLowerCase() || 'audio/webm';
}

function safeAudioExtension(fileName: string, mimeType: string) {
  const current = extname(fileName).toLowerCase();
  if (/^\.[a-z0-9]{2,5}$/.test(current)) return current;
  if (mimeType === 'audio/mp4') return '.m4a';
  if (mimeType === 'audio/aac') return '.aac';
  if (mimeType === 'audio/wav' || mimeType === 'audio/x-wav') return '.wav';
  if (mimeType === 'audio/mpeg') return '.mp3';
  if (mimeType === 'audio/ogg') return '.ogg';
  return '.webm';
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
