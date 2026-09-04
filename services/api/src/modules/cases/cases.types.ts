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
}

export interface TranscriptJob {
  id: string;
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
