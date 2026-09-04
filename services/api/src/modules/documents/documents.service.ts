import { BadRequestException, Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { DocumentRecord, EvidenceFolder, UploadSession } from './documents.types';
import { DOCUMENTS_REPOSITORY } from './repositories/documents-repository.provider';
import { DocumentsRepository } from './repositories/documents.repository';

const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/heic',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);
const ALLOWED_EXT = new Set(['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'heic', 'xlsx']);
const MAX_SIZE_BYTES = 25 * 1024 * 1024;

@Injectable()
export class DocumentsService {
  private readonly uploadSessions = new Map<string, UploadSession>();
  private readonly documents = new Map<string, DocumentRecord>();
  private readonly evidenceFolders = new Map<string, EvidenceFolder>();
  private readonly hashes = new Map<string, string>();

  constructor(@Optional() @Inject(DOCUMENTS_REPOSITORY) private readonly repository?: DocumentsRepository) {}

  async createUploadSession(input: { caseId: string; fileName: string; mimeType: string; sizeBytes: number }) {
    validateFile(input.fileName, input.mimeType, input.sizeBytes);
    const session: UploadSession = {
      id: randomUUID(),
      caseId: input.caseId,
      fileName: safeFileName(input.fileName),
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      status: 'upload_pending',
      uploadUrl: `stub://upload/${randomUUID()}`,
      createdAt: new Date().toISOString(),
    };
    if (this.repository) return this.repository.createUploadSession(session);
    this.uploadSessions.set(session.id, session);
    return session;
  }

  async completeUpload(input: { uploadSessionId: string; sha256?: string }) {
    const session = this.repository
      ? await this.repository.findUploadSessionById(input.uploadSessionId)
      : this.uploadSessions.get(input.uploadSessionId);
    if (!session) throw new NotFoundException('UPLOAD_SESSION_NOT_FOUND');
    const sha256 = input.sha256 ?? hashStub(`${session.caseId}:${session.fileName}:${session.sizeBytes}`);
    const duplicate = this.repository ? await this.repository.findDocumentBySha256(sha256) : this.hashes.has(sha256);
    if (duplicate) throw new BadRequestException('DUPLICATE_FILE');

    const document: DocumentRecord = {
      id: randomUUID(),
      caseId: session.caseId,
      fileName: session.fileName,
      mimeType: session.mimeType,
      sizeBytes: session.sizeBytes,
      sha256,
      status: 'ocr_review_required',
      extractedFields: extractFieldsStub(session.fileName),
      createdAt: new Date().toISOString(),
    };
    if (this.repository) return this.repository.createDocument(document);
    this.hashes.set(sha256, document.id);
    this.documents.set(document.id, document);
    return document;
  }

  async listDocuments(caseId: string) {
    if (this.repository) return this.repository.listDocuments(caseId);
    return [...this.documents.values()].filter((document) => document.caseId === caseId);
  }

  async confirmOcr(documentId: string, fields: Record<string, string>) {
    const document = this.repository ? await this.repository.findDocumentById(documentId) : this.documents.get(documentId);
    if (!document) throw new NotFoundException('DOCUMENT_NOT_FOUND');
    if (this.repository) return this.repository.updateDocumentOcr({ documentId, fields, status: 'ready' });
    document.extractedFields = fields;
    document.status = 'ready';
    return document;
  }

  async createEvidenceFolder(input: { caseId: string; title: string; documentIds?: string[] }) {
    if (!input.title) throw new BadRequestException('EVIDENCE_TITLE_REQUIRED');
    const folder: EvidenceFolder = {
      id: randomUUID(),
      caseId: input.caseId,
      title: input.title,
      assessment: input.documentIds?.length ? 'possibly_admissible' : 'insufficient',
      documentIds: input.documentIds ?? [],
      createdAt: new Date().toISOString(),
    };
    if (this.repository) return this.repository.createEvidenceFolder(folder);
    this.evidenceFolders.set(folder.id, folder);
    return folder;
  }

  async listEvidence(caseId: string) {
    if (this.repository) return this.repository.listEvidence(caseId);
    return [...this.evidenceFolders.values()].filter((folder) => folder.caseId === caseId);
  }
}

export function validateFile(fileName: string, mimeType: string, sizeBytes: number) {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_EXT.has(ext)) throw new BadRequestException('FILE_EXTENSION_NOT_ALLOWED');
  if (!ALLOWED_MIME.has(mimeType)) throw new BadRequestException('MIME_NOT_ALLOWED');
  if (sizeBytes <= 0 || sizeBytes > MAX_SIZE_BYTES) throw new BadRequestException('FILE_SIZE_INVALID');
}

export function safeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9а-яА-ЯёЁ._ -]/g, '_').slice(0, 120);
}

function hashStub(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function extractFieldsStub(fileName: string) {
  return {
    documentTitle: safeFileName(fileName),
    reviewRequired: 'true',
    warning: 'OCR stub. Пользователь должен подтвердить извлеченные поля.',
  };
}
