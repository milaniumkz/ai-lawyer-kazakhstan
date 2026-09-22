export type LegalSourceStatus = 'draft' | 'active' | 'expired' | 'cancelled' | 'blocked';
export type CitationStatus = 'confirmed' | 'invalid' | 'insufficient_authoritative_sources';

export interface LegalSourceFragment {
  id: string;
  officialId: string;
  title: string;
  sourceType: string;
  authority: string;
  language: 'ru' | 'kk' | 'en';
  article?: string;
  point?: string;
  text: string;
  sourceUrl: string;
  retrievedAt: string;
  effectiveFrom: string;
  effectiveTo?: string;
  checksum: string;
  sourceVersion: string;
  embeddingVersion: string;
  status: LegalSourceStatus;
}

export interface CitationValidationResult {
  status: CitationStatus;
  message: string;
  requiredAction?: 'clarify_or_human_review';
  fragment?: LegalSourceFragment;
  aiProvider?: string;
  modelId?: string;
}
