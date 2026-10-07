import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../common/database/database.service';
import { LegalCaseRecord, MessageRecord, TranscriptJob } from '../cases.types';
import { CasesRepository } from './cases.repository';

@Injectable()
export class PostgresCasesRepository implements CasesRepository {
  constructor(private readonly db: DatabaseService) {}

  async createCase(input: Omit<LegalCaseRecord, 'id' | 'createdAt'>) {
    const result = await this.db.query<CaseRow>(
      `INSERT INTO legal_cases
        (owner_user_id, profile_id, title, problem_text, category, subcategory, confidence, status, readiness_percent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        input.ownerUserId,
        input.profileId ?? null,
        input.title,
        input.problemText,
        input.category,
        input.subcategory ?? null,
        input.confidence,
        input.status,
        input.readinessPercent,
      ],
    );
    return mapCase(result.rows[0]!);
  }

  async findCaseById(caseId: string) {
    const result = await this.db.query<CaseRow>('SELECT * FROM legal_cases WHERE id = $1 LIMIT 1', [caseId]);
    return result.rows[0] ? mapCase(result.rows[0]) : undefined;
  }

  async listCases(ownerUserId: string) {
    const result = await this.db.query<CaseRow>('SELECT * FROM legal_cases WHERE owner_user_id = $1 ORDER BY created_at DESC', [ownerUserId]);
    return result.rows.map(mapCase);
  }

  async rememberIdempotencyKey(input: { key: string; ownerUserId: string; caseId: string }) {
    await this.db.query(
      `INSERT INTO case_idempotency_keys (key, owner_user_id, case_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (key) DO NOTHING`,
      [input.key, input.ownerUserId, input.caseId],
    );
  }

  async findCaseByIdempotencyKey(key: string) {
    const result = await this.db.query<CaseRow>(
      `SELECT c.*
       FROM case_idempotency_keys i
       JOIN legal_cases c ON c.id = i.case_id
       WHERE i.key = $1
       LIMIT 1`,
      [key],
    );
    return result.rows[0] ? mapCase(result.rows[0]) : undefined;
  }

  async createMessage(input: Omit<MessageRecord, 'id' | 'createdAt'>) {
    const result = await this.db.query<MessageRow>(
      'INSERT INTO messages (case_id, role, text) VALUES ($1, $2, $3) RETURNING *',
      [input.caseId, input.role, input.text],
    );
    return mapMessage(result.rows[0]!);
  }

  async findMessage(id: string) {
    const result=await this.db.query<MessageRow>('SELECT * FROM messages WHERE id=$1',[id]);
    return result.rows[0] ? mapMessage(result.rows[0]) : undefined;
  }
  async saveTurn(messages: MessageRecord[]) {
    await this.db.query(`INSERT INTO messages (id,case_id,role,text,created_at) VALUES ($1,$2,$3,$4,$5),($6,$7,$8,$9,$10) ON CONFLICT(id) DO NOTHING`, messages.flatMap(message=>[message.id,message.caseId,message.role,message.text,message.createdAt]));
  }

  async listMessages(caseId: string) {
    const result = await this.db.query<MessageRow>('SELECT * FROM messages WHERE case_id = $1 ORDER BY created_at ASC', [caseId]);
    return result.rows.map(mapMessage);
  }

  async createTranscript(input: Omit<TranscriptJob, 'id' | 'createdAt'>) {
    const result = await this.db.query<TranscriptRow>(
      `INSERT INTO transcript_jobs
        (owner_user_id, case_id, status, language, transcript, low_confidence_fragments, audio_file_id, audio_mime_type, audio_size_bytes, audio_sha256, audio_storage_key)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        input.ownerUserId,
        input.caseId ?? null,
        input.status,
        input.language,
        input.transcript,
        input.lowConfidenceFragments,
        input.audioFileId ?? null,
        input.audioMimeType ?? null,
        input.audioSizeBytes ?? null,
        input.audioSha256 ?? null,
        input.audioStorageKey ?? null,
      ],
    );
    return mapTranscript(result.rows[0]!);
  }

  async findTranscriptById(id: string) {
    const result = await this.db.query<TranscriptRow>('SELECT * FROM transcript_jobs WHERE id = $1 LIMIT 1', [id]);
    return result.rows[0] ? mapTranscript(result.rows[0]) : undefined;
  }
}

interface CaseRow {
  id: string;
  owner_user_id?: string | null;
  profile_id?: string | null;
  title: string;
  problem_text: string;
  category: string;
  subcategory?: string | null;
  confidence: string | number;
  status: LegalCaseRecord['status'];
  readiness_percent: number;
  created_at: Date;
}

interface MessageRow {
  id: string;
  case_id: string;
  role: MessageRecord['role'];
  text: string;
  created_at: Date;
}

interface TranscriptRow {
  id: string;
  owner_user_id: string;
  case_id?: string | null;
  status: TranscriptJob['status'];
  language: TranscriptJob['language'];
  transcript: string;
  low_confidence_fragments: string[];
  audio_file_id?: string | null;
  audio_mime_type?: string | null;
  audio_size_bytes?: string | number | null;
  audio_sha256?: string | null;
  audio_storage_key?: string | null;
  created_at: Date;
}

export function mapCase(row: CaseRow): LegalCaseRecord {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id ?? '',
    profileId: row.profile_id ?? undefined,
    title: row.title,
    problemText: row.problem_text,
    category: row.category,
    subcategory: row.subcategory ?? undefined,
    confidence: Number(row.confidence),
    status: row.status,
    readinessPercent: row.readiness_percent,
    createdAt: row.created_at.toISOString(),
  };
}

export function mapMessage(row: MessageRow): MessageRecord {
  return {
    id: row.id,
    caseId: row.case_id,
    role: row.role,
    text: row.text,
    createdAt: row.created_at.toISOString(),
  };
}

export function mapTranscript(row: TranscriptRow): TranscriptJob {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    caseId: row.case_id ?? undefined,
    status: row.status,
    language: row.language,
    transcript: row.transcript,
    lowConfidenceFragments: row.low_confidence_fragments,
    audioFileId: row.audio_file_id ?? undefined,
    audioMimeType: row.audio_mime_type ?? undefined,
    audioSizeBytes: row.audio_size_bytes == null ? undefined : Number(row.audio_size_bytes),
    audioSha256: row.audio_sha256 ?? undefined,
    audioStorageKey: row.audio_storage_key ?? undefined,
    createdAt: row.created_at.toISOString(),
  };
}
