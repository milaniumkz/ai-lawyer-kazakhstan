import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { DatabaseService } from '../../common/database/database.service';
import { ChatProgressStatus, LegalCaseRecord, MessageRecord, TranscriptJob } from './cases.types';
import { CASE_TAXONOMY, LEGAL_CATEGORIES, classifyByTaxonomy, classifyStructuredDispute, getLegalCategory, validateStructuredClassification, StructuredClassification } from './case-taxonomy';
import { CASES_REPOSITORY } from './repositories/cases-repository.provider';
import { CasesRepository } from './repositories/cases.repository';

const PROGRESS: ChatProgressStatus[] = ['transcribing', 'classifying', 'retrieving_sources', 'validating', 'generating', 'ready'];
const ALLOWED_AUDIO_MIME_TYPES = new Set(['audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/wav', 'audio/x-wav']);

@Injectable()
export class CasesService {
  private readonly cases = new Map<string, LegalCaseRecord>();
  private readonly messages = new Map<string, MessageRecord[]>();
  private readonly transcripts = new Map<string, TranscriptJob>();
  private readonly classifications = new Map<string, ClassificationRecord>();
  private readonly feedback = new Map<string, ClassificationFeedbackRecord>();
  private readonly idempotency = new Map<string, LegalCaseRecord>();

  constructor(
    @Optional() @Inject(CASES_REPOSITORY) private readonly repository?: CasesRepository,
    private readonly db?: DatabaseService,
  ) {}

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

  listCategories() {
    return CASE_TAXONOMY;
  }

  listLegalCategories() {
    return LEGAL_CATEGORIES.map(stripCategoryInternals);
  }

  listLegalCategoryTree() {
    const categories = this.listLegalCategories();
    return categories
      .filter((item) => !item.parentId)
      .map((root) => ({ ...root, children: categories.filter((item) => item.parentId === root.code) }));
  }

  async classifyDispute(input: { caseId?: string; conversationId?: string; inputMessageId?: string; text: string }, ownerUserId: string) {
    if (!input.text?.trim() || input.text.trim().length < 4) throw new BadRequestException('CLASSIFICATION_TEXT_REQUIRED');
    if (input.caseId) await this.getCase(input.caseId, ownerUserId);
    const result = validateStructuredClassification(classifyStructuredDispute(input.text));
    const record: ClassificationRecord = {
      id: randomUUID(),
      ownerUserId,
      caseId: input.caseId,
      conversationId: input.conversationId,
      inputMessageId: input.inputMessageId,
      result,
      userConfirmed: false,
      userOverridden: false,
      createdAt: new Date().toISOString(),
    };
    return this.persistClassification(record);
  }

  async getClassification(id: string, ownerUserId: string) {
    const record = await this.findClassification(id);
    if (!record) throw new NotFoundException('CLASSIFICATION_NOT_FOUND');
    if (record.ownerUserId !== ownerUserId) throw new ForbiddenException('CLASSIFICATION_ACCESS_DENIED');
    return record;
  }

  async getCaseClassification(caseId: string, ownerUserId: string) {
    await this.getCase(caseId, ownerUserId);
    const records = await this.listClassificationsByCase(caseId);
    const latest = records.at(-1);
    if (!latest) throw new NotFoundException('CLASSIFICATION_NOT_FOUND');
    return latest;
  }

  async answerClarifications(id: string, input: { answers: Record<string, unknown> }, ownerUserId: string) {
    const record = await this.getClassification(id, ownerUserId);
    const mergedFacts = { ...record.result.facts, ...input.answers };
    const answered = new Set(Object.keys(input.answers ?? {}));
    const missing = record.result.missing_facts.filter((field) => !answered.has(field));
    const updated = { ...record, result: { ...record.result, facts: mergedFacts, missing_facts: missing, clarification_questions: record.result.clarification_questions.filter((q) => !answered.has(q.id)) } };
    return this.persistClassification(updated);
  }

  async confirmClassification(id: string, ownerUserId: string) {
    const record = await this.getClassification(id, ownerUserId);
    if (record.userConfirmed) return record;
    const updated = { ...record, userConfirmed: true, confirmedAt: new Date().toISOString() };
    return this.persistClassification(updated);
  }

  async overrideClassification(id: string, input: { subcategoryCode: string; reason?: string }, ownerUserId: string) {
    const record = await this.getClassification(id, ownerUserId);
    return this.applyClassificationOverride(record, input, 'user');
  }

  async adminListClassificationReviewQueue() {
    if (this.db && process.env.DATABASE_URL) {
      const result = await this.db.query<ClassificationRow>(
        `SELECT * FROM case_classifications
         WHERE user_confirmed = false OR risk_level = 'high' OR jsonb_array_length(missing_facts) > 0
         ORDER BY created_at DESC
         LIMIT 50`,
      );
      return result.rows.map(mapClassificationRow);
    }
    return [...this.classifications.values()]
      .filter((item) => !item.userConfirmed || item.result.risk_level === 'high' || item.result.missing_facts.length > 0)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 50);
  }

  async adminConfirmClassification(id: string) {
    const record = await this.findClassification(id);
    if (!record) throw new NotFoundException('CLASSIFICATION_NOT_FOUND');
    if (record.userConfirmed) return record;
    return this.persistClassification({ ...record, userConfirmed: true, confirmedAt: new Date().toISOString() });
  }

  async adminOverrideClassification(id: string, input: { subcategoryCode: string; reason?: string }) {
    const record = await this.findClassification(id);
    if (!record) throw new NotFoundException('CLASSIFICATION_NOT_FOUND');
    return this.applyClassificationOverride(record, input, 'expert');
  }

  private async applyClassificationOverride(record: ClassificationRecord, input: { subcategoryCode: string; reason?: string }, source: 'user' | 'expert') {
    const category = getLegalCategory(input.subcategoryCode);
    if (!category?.parentId) throw new BadRequestException('UNKNOWN_SUBCATEGORY_CODE');
    const parent = getLegalCategory(category.parentId);
    if (!parent) throw new BadRequestException('UNKNOWN_CATEGORY_CODE');
    const updated: ClassificationRecord = {
      ...record,
      result: {
        ...record.result,
        category_code: parent.code,
        subcategory_code: category.code,
        category_label: parent.nameRu,
        subcategory_label: category.nameRu,
        confidence: 1,
        alternatives: record.result.alternatives.filter((item) => item.code !== category.code),
        reasons: [source === 'expert' ? 'expert_manual_override' : 'user_manual_override', input.reason ?? `${source}_selected_category`],
        required_human_review: category.highRisk || category.defaultLegalRoute === 'criminal_high_risk',
        risk_level: category.highRisk ? 'high' : record.result.risk_level,
        risk_flags: category.highRisk ? [...new Set([...record.result.risk_flags, 'high_risk_category'])] : record.result.risk_flags,
      },
      userConfirmed: true,
      userOverridden: true,
      confirmedAt: new Date().toISOString(),
    };
    const stored = await this.persistClassification(updated);
    const feedbackRecord: ClassificationFeedbackRecord = {
      id: randomUUID(),
      classificationId: record.id,
      ownerUserId: record.ownerUserId,
      source,
      correctedCategoryCode: category.code,
      reason: input.reason,
      createdAt: new Date().toISOString(),
    };
    await this.persistFeedback(feedbackRecord);
    return stored;
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

  private async persistClassification(record: ClassificationRecord) {
    this.classifications.set(record.id, record);
    if (this.db && process.env.DATABASE_URL) {
      await this.db.query(
        `INSERT INTO case_classifications (
          id, case_id, conversation_id, input_message_id, language, jurisdiction, category_code, subcategory_code,
          confidence, alternatives, facts, missing_facts, clarification_questions, risk_level, risk_flags,
          urgency, complexity, model_provider, model_id, prompt_version, user_confirmed, user_overridden, created_at, confirmed_at, owner_user_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12::jsonb, $13::jsonb, $14, $15::jsonb,
          $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
        )
        ON CONFLICT (id) DO UPDATE SET
          alternatives = EXCLUDED.alternatives,
          facts = EXCLUDED.facts,
          missing_facts = EXCLUDED.missing_facts,
          clarification_questions = EXCLUDED.clarification_questions,
          risk_level = EXCLUDED.risk_level,
          risk_flags = EXCLUDED.risk_flags,
          user_confirmed = EXCLUDED.user_confirmed,
          user_overridden = EXCLUDED.user_overridden,
          confirmed_at = EXCLUDED.confirmed_at`,
        [
          record.id,
          record.caseId ?? null,
          record.conversationId ?? null,
          record.inputMessageId ?? null,
          record.result.language,
          record.result.jurisdiction,
          record.result.category_code,
          record.result.subcategory_code,
          record.result.confidence,
          JSON.stringify(record.result.alternatives),
          JSON.stringify(record.result.facts),
          JSON.stringify(record.result.missing_facts),
          JSON.stringify(record.result.clarification_questions),
          record.result.risk_level,
          JSON.stringify(record.result.risk_flags),
          record.result.urgency,
          record.result.complexity,
          'local-structured',
          'taxonomy-v1',
          'category-v1',
          record.userConfirmed,
          record.userOverridden,
          record.createdAt,
          record.confirmedAt ?? null,
          record.ownerUserId,
        ],
      );
    }
    return record;
  }

  private async findClassification(id: string) {
    if (this.db && process.env.DATABASE_URL) {
      const result = await this.db.query<ClassificationRow>('SELECT * FROM case_classifications WHERE id = $1', [id]);
      const row = result.rows[0];
      if (row) return mapClassificationRow(row);
    }
    return this.classifications.get(id);
  }

  private async listClassificationsByCase(caseId: string) {
    if (this.db && process.env.DATABASE_URL) {
      const result = await this.db.query<ClassificationRow>('SELECT * FROM case_classifications WHERE case_id = $1 ORDER BY created_at ASC', [caseId]);
      return result.rows.map(mapClassificationRow);
    }
    return [...this.classifications.values()].filter((item) => item.caseId === caseId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  private async persistFeedback(record: ClassificationFeedbackRecord) {
    this.feedback.set(record.id, record);
    if (this.db && process.env.DATABASE_URL) {
      await this.db.query(
        `INSERT INTO classification_feedback (id, classification_id, owner_user_id, source, corrected_category_code, reason, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [record.id, record.classificationId, record.ownerUserId, record.source, record.correctedCategoryCode, record.reason ?? null, record.createdAt],
      );
    }
    return record;
  }
}

type ClassificationRecord = {
  id: string;
  ownerUserId: string;
  caseId?: string;
  conversationId?: string;
  inputMessageId?: string;
  result: StructuredClassification;
  userConfirmed: boolean;
  userOverridden: boolean;
  createdAt: string;
  confirmedAt?: string;
};

type ClassificationFeedbackRecord = {
  id: string;
  classificationId: string;
  ownerUserId: string;
  source: 'user' | 'expert';
  correctedCategoryCode: string;
  reason?: string;
  createdAt: string;
};

type ClassificationRow = {
  id: string;
  owner_user_id: string;
  case_id: string | null;
  conversation_id: string | null;
  input_message_id: string | null;
  language: 'ru' | 'kk' | 'en';
  jurisdiction: 'KZ';
  category_code: string;
  subcategory_code: string;
  confidence: string | number;
  alternatives: StructuredClassification['alternatives'];
  facts: Record<string, unknown>;
  missing_facts: string[];
  clarification_questions: StructuredClassification['clarification_questions'];
  risk_level: 'low' | 'medium' | 'high';
  risk_flags: string[];
  urgency: 'low' | 'normal' | 'high';
  complexity: 'low' | 'medium' | 'high';
  user_confirmed: boolean;
  user_overridden: boolean;
  created_at: Date;
  confirmed_at: Date | null;
};

function mapClassificationRow(row: ClassificationRow): ClassificationRecord {
  const parent = getLegalCategory(row.category_code);
  const child = getLegalCategory(row.subcategory_code);
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    caseId: row.case_id ?? undefined,
    conversationId: row.conversation_id ?? undefined,
    inputMessageId: row.input_message_id ?? undefined,
    result: {
      language: row.language,
      jurisdiction: row.jurisdiction,
      category_code: row.category_code,
      subcategory_code: row.subcategory_code,
      category_label: parent?.nameRu ?? row.category_code,
      subcategory_label: child?.nameRu ?? row.subcategory_code,
      confidence: Number(row.confidence),
      alternatives: row.alternatives,
      facts: row.facts,
      missing_facts: row.missing_facts,
      clarification_questions: row.clarification_questions,
      risk_level: row.risk_level,
      risk_flags: row.risk_flags,
      urgency: row.urgency,
      complexity: row.complexity,
      reasons: ['stored_classification'],
      required_human_review: Boolean(child?.highRisk),
    },
    userConfirmed: row.user_confirmed,
    userOverridden: row.user_overridden,
    createdAt: row.created_at.toISOString(),
    confirmedAt: row.confirmed_at?.toISOString(),
  };
}

function stripCategoryInternals(category: (typeof LEGAL_CATEGORIES)[number]) {
  const publicCategory = { ...category } as Partial<typeof category>;
  delete publicCategory.keywords;
  return publicCategory;
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
  return classifyByTaxonomy(text);
}

function makeTitle(text: string) {
  const compact = text.trim().replace(/\s+/g, ' ');
  return compact.length > 48 ? `${compact.slice(0, 45)}...` : compact;
}
