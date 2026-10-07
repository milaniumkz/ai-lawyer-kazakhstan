import { BadRequestException, Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { CasesService } from '../cases/cases.service';
import { documentStorageRoot as storageRoot } from './document-storage';
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

  constructor(
    @Optional() @Inject(DOCUMENTS_REPOSITORY) private readonly repository?: DocumentsRepository,
    @Optional() private readonly cases?: CasesService,
  ) {}

  async createUploadSession(input: { caseId: string; fileName: string; mimeType: string; sizeBytes: number }, ownerUserId?: string) {
    await this.assertCaseOwner(input.caseId, ownerUserId);
    validateFile(input.fileName, input.mimeType, input.sizeBytes);
    const session: UploadSession = {
      id: randomUUID(),
      caseId: input.caseId,
      fileName: safeFileName(input.fileName),
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      status: 'upload_pending',
      uploadUrl: `/files/uploads/${randomUUID()}/content`,
      createdAt: new Date().toISOString(),
    };
    if (this.repository) return this.repository.createUploadSession(session);
    this.uploadSessions.set(session.id, session);
    return session;
  }

  async completeUpload(input: { uploadSessionId: string; sha256?: string }, ownerUserId?: string) {
    const session = this.repository
      ? await this.repository.findUploadSessionById(input.uploadSessionId)
      : this.uploadSessions.get(input.uploadSessionId);
    if (!session) throw new NotFoundException('UPLOAD_SESSION_NOT_FOUND');
    await this.assertCaseOwner(session.caseId, ownerUserId);
    const token = uploadToken(session);
    let receipt: { sha256: string; sizeBytes: number };
    try {
      receipt = JSON.parse(await readFile(join(storageRoot(session.caseId), `${token}.json`), 'utf8'));
    } catch { throw new BadRequestException('FILE_CONTENT_NOT_UPLOADED'); }
    const sha256 = receipt.sha256;
    if (input.sha256 && input.sha256 !== sha256) throw new BadRequestException('FILE_HASH_MISMATCH');
    // Check the actual stored bytes, including after a service restart.
    const bytes = await readFile(join(storageRoot(session.caseId), sha256));
    if (bytes.length !== session.sizeBytes || hashBytes(bytes) !== sha256) throw new BadRequestException('FILE_CONTENT_INVALID');
    const duplicate = this.repository ? await this.repository.findDocumentBySha256(sha256, session.caseId) :
      [...this.documents.values()].find((item) => item.sha256 === sha256 && item.caseId === session.caseId);
    if (duplicate) return duplicate;

    const document: DocumentRecord = {
      id: randomUUID(),
      caseId: session.caseId,
      fileName: session.fileName,
      mimeType: session.mimeType,
      sizeBytes: session.sizeBytes,
      sha256,
      status: 'ocr_review_required',
      extractedFields: { documentTitle: session.fileName, reviewRequired: 'true', warning: 'Файл сохранён. Автоматический OCR недоступен: проверьте и внесите поля вручную.' },
      createdAt: new Date().toISOString(),
    };
    if (this.repository) return this.repository.createDocument(document);
    this.hashes.set(sha256, document.id);
    this.documents.set(document.id, document);
    return document;
  }

  async uploadContent(token: string, bytes: Buffer, mimeType: string, ownerUserId: string, sessionId: string) {
    const session = this.repository ? await this.repository.findUploadSessionById(sessionId) : this.uploadSessions.get(sessionId);
    if (!session || uploadToken(session) !== token) throw new NotFoundException('UPLOAD_SESSION_NOT_FOUND');
    await this.assertCaseOwner(session.caseId, ownerUserId);
    if (Date.now() - Date.parse(session.createdAt) > 60 * 60 * 1000) throw new BadRequestException('UPLOAD_SESSION_EXPIRED');
    if (bytes.length !== session.sizeBytes || mimeType !== session.mimeType) throw new BadRequestException('FILE_CONTENT_INVALID');
    validateSignature(bytes, mimeType);
    const sha256 = hashBytes(bytes);
    await mkdir(storageRoot(session.caseId), { recursive: true, mode: 0o700 });
    await writeFile(join(storageRoot(session.caseId), sha256), bytes, { mode: 0o600 });
    await writeFile(join(storageRoot(session.caseId), `${token}.json`), JSON.stringify({ sha256, sizeBytes: bytes.length }), { mode: 0o600 });
    return { sha256, sizeBytes: bytes.length, status: 'uploaded' };
  }

  async downloadContent(documentId: string, ownerUserId: string) {
    const document = this.repository ? await this.repository.findDocumentById(documentId) : this.documents.get(documentId);
    if (!document) throw new NotFoundException('DOCUMENT_NOT_FOUND');
    await this.assertCaseOwner(document.caseId, ownerUserId);
    if (!/^[a-f0-9]{64}$/.test(document.sha256)) throw new NotFoundException('FILE_CONTENT_NOT_FOUND');
    try {
      const bytes = await readFile(join(storageRoot(document.caseId), document.sha256));
      return { document, bytes };
    } catch { throw new NotFoundException('FILE_CONTENT_NOT_FOUND'); }
  }

  async listDocuments(caseId: string, ownerUserId?: string) {
    await this.assertCaseOwner(caseId, ownerUserId);
    if (this.repository) return this.repository.listDocuments(caseId);
    return [...this.documents.values()].filter((document) => document.caseId === caseId);
  }

  async confirmOcr(documentId: string, fields: Record<string, string>, ownerUserId?: string) {
    const document = this.repository ? await this.repository.findDocumentById(documentId) : this.documents.get(documentId);
    if (!document) throw new NotFoundException('DOCUMENT_NOT_FOUND');
    await this.assertCaseOwner(document.caseId, ownerUserId);
    if (this.repository) return this.repository.updateDocumentOcr({ documentId, fields, status: 'ready' });
    document.extractedFields = fields;
    document.status = 'ready';
    return document;
  }

  async adminListDocumentReviewQueue() {
    if (this.repository) return this.repository.listDocumentsForAdminReview(50);
    return [...this.documents.values()]
      .filter((document) => ['ocr_review_required', 'quarantined', 'rejected'].includes(document.status))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 50);
  }

  async adminConfirmOcr(documentId: string, fields: Record<string, string>) {
    const document = this.repository ? await this.repository.findDocumentById(documentId) : this.documents.get(documentId);
    if (!document) throw new NotFoundException('DOCUMENT_NOT_FOUND');
    const nextFields = Object.keys(fields ?? {}).length ? fields : document.extractedFields;
    if (this.repository) return this.repository.updateDocumentOcr({ documentId, fields: nextFields, status: 'ready' });
    document.extractedFields = nextFields;
    document.status = 'ready';
    return document;
  }

  async adminRejectDocument(documentId: string, reason?: string) {
    const document = this.repository ? await this.repository.findDocumentById(documentId) : this.documents.get(documentId);
    if (!document) throw new NotFoundException('DOCUMENT_NOT_FOUND');
    const fields = { ...document.extractedFields, adminReviewStatus: 'rejected', adminReviewReason: reason ?? 'admin_rejected' };
    if (this.repository) return this.repository.updateDocumentOcr({ documentId, fields, status: 'rejected' });
    document.extractedFields = fields;
    document.status = 'rejected';
    return document;
  }

  async createEvidenceFolder(input: { caseId: string; title: string; documentIds?: string[] }, ownerUserId?: string) {
    await this.assertCaseOwner(input.caseId, ownerUserId);
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

  async listEvidence(caseId: string, ownerUserId?: string) {
    await this.assertCaseOwner(caseId, ownerUserId);
    if (this.repository) return this.repository.listEvidence(caseId);
    return [...this.evidenceFolders.values()].filter((folder) => folder.caseId === caseId);
  }

  private async assertCaseOwner(caseId: string, ownerUserId?: string) {
    if (ownerUserId === undefined || !this.cases) return;
    await this.cases.getCase(caseId, ownerUserId);
  }
}

export function validateFile(fileName: string, mimeType: string, sizeBytes: number) {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_EXT.has(ext)) throw new BadRequestException('FILE_EXTENSION_NOT_ALLOWED');
  if (!ALLOWED_MIME.has(mimeType)) throw new BadRequestException('MIME_NOT_ALLOWED');
  if (!Number.isSafeInteger(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_SIZE_BYTES) throw new BadRequestException('FILE_SIZE_INVALID');
}

export function safeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9а-яА-ЯёЁ._ -]/g, '_').slice(0, 120);
}

function uploadToken(session: UploadSession) {
  const token = session.uploadUrl.match(/^\/files\/uploads\/([a-f0-9-]{36})\/content$/)?.[1];
  if (!token) throw new BadRequestException('UPLOAD_SESSION_LEGACY_CREATE_NEW');
  return token;
}
function hashBytes(bytes: Buffer) { return createHash('sha256').update(bytes).digest('hex'); }
function validateSignature(bytes: Buffer, mime: string) {
  const valid = mime === 'application/pdf' ? bytes.subarray(0, 5).toString() === '%PDF-' :
    mime === 'image/png' ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) :
    mime === 'image/jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 :
    mime === 'image/heic' ? bytes.subarray(4, 8).toString() === 'ftyp' :
    mime === 'application/msword' ? bytes.subarray(0, 8).equals(Buffer.from([208, 207, 17, 224, 161, 177, 26, 225])) :
    bytes.subarray(0, 4).equals(Buffer.from([80, 75, 3, 4]));
  if (!valid) throw new BadRequestException('FILE_SIGNATURE_INVALID');
}
