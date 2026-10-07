import { LegalCaseRecord, MessageRecord, TranscriptJob } from '../cases.types';

export interface CasesRepository {
  createCase(input: Omit<LegalCaseRecord, 'id' | 'createdAt'>): Promise<LegalCaseRecord>;
  findCaseById(caseId: string): Promise<LegalCaseRecord | undefined>;
  listCases(ownerUserId: string): Promise<LegalCaseRecord[]>;
  rememberIdempotencyKey(input: { key: string; ownerUserId: string; caseId: string }): Promise<void>;
  findCaseByIdempotencyKey(key: string): Promise<LegalCaseRecord | undefined>;
  createMessage(input: Omit<MessageRecord, 'id' | 'createdAt'>): Promise<MessageRecord>;
  saveTurn?(messages: MessageRecord[]): Promise<void>;
  findMessage?(id: string): Promise<MessageRecord | undefined>;
  listMessages(caseId: string): Promise<MessageRecord[]>;
  createTranscript(input: Omit<TranscriptJob, 'id' | 'createdAt'>): Promise<TranscriptJob>;
  findTranscriptById(id: string): Promise<TranscriptJob | undefined>;
}
