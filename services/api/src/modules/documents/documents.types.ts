export type FileStatus = 'upload_pending' | 'quarantined' | 'ocr_review_required' | 'ready' | 'rejected';
export type EvidenceAssessment = 'relevant' | 'possibly_admissible' | 'insufficient' | 'contradictory' | 'unknown';

export interface UploadSession {
  id: string;
  caseId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  status: FileStatus;
  uploadUrl: string;
  createdAt: string;
}

export interface DocumentRecord {
  id: string;
  caseId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  status: FileStatus;
  extractedFields: Record<string, string>;
  createdAt: string;
}

export interface EvidenceFolder {
  id: string;
  caseId: string;
  title: string;
  assessment: EvidenceAssessment;
  documentIds: string[];
  createdAt: string;
}
