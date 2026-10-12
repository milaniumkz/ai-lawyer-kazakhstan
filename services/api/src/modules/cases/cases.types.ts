export type CaseStatus =
  | 'consultation'
  | 'clarification_required'
  | 'collecting_documents'
  | 'document_drafting'
  | 'review_required';

export type ChatProgressStatus =
  | 'transcribing'
  | 'classifying'
  | 'retrieving_sources'
  | 'validating'
  | 'generating'
  | 'review_required'
  | 'ready'
  | 'failed';

export interface LegalCaseRecord {
  id: string;
  ownerUserId: string;
  profileId?: string;
  title: string;
  problemText: string;
  category: string;
  subcategory?: string;
  confidence: number;
  status: CaseStatus;
  readinessPercent: number;
  createdAt: string;
}

export interface MessageRecord {
  id: string;
  caseId: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  createdAt: string;
  ai?: AiConversation;
  attachments?: Array<{id:string;fileName:string;mimeType:string;sizeBytes:number}>;
}

export interface AiConversation {
  provider: 'openai';
  model: string;
  facts: Record<string, string>;
  missingFields: string[];
  citations: Array<{ url: string; title: string; article: string; quote: string; effectiveDate: string; checkedAt?: string }>;
  readyForDraft: boolean;
  factsConfirmed?: boolean;
  requiresDocument?: boolean;
  draftMessageId?: string;
  draftBody?: string;
}

export interface TranscriptJob {
  id: string;
  ownerUserId: string;
  caseId?: string;
  status: ChatProgressStatus;
  language: 'ru' | 'kk' | 'en';
  transcript: string;
  lowConfidenceFragments: string[];
  audioFileId?: string;
  audioMimeType?: string;
  audioSizeBytes?: number;
  audioSha256?: string;
  audioStorageKey?: string;
  createdAt: string;
}
