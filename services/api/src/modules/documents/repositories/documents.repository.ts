import { DocumentRecord, EvidenceFolder, UploadSession } from '../documents.types';

export interface DocumentsRepository {
  createUploadSession(input: Omit<UploadSession, 'id' | 'createdAt'>): Promise<UploadSession>;
  findUploadSessionById(id: string): Promise<UploadSession | undefined>;
  createDocument(input: Omit<DocumentRecord, 'id' | 'createdAt'>): Promise<DocumentRecord>;
  findDocumentById(id: string): Promise<DocumentRecord | undefined>;
  findDocumentBySha256(sha256: string): Promise<DocumentRecord | undefined>;
  listDocuments(caseId: string): Promise<DocumentRecord[]>;
  listDocumentsForAdminReview(limit: number): Promise<DocumentRecord[]>;
  updateDocumentOcr(input: { documentId: string; fields: Record<string, string>; status: DocumentRecord['status'] }): Promise<DocumentRecord>;
  createEvidenceFolder(input: Omit<EvidenceFolder, 'id' | 'createdAt'>): Promise<EvidenceFolder>;
  listEvidence(caseId: string): Promise<EvidenceFolder[]>;
}
