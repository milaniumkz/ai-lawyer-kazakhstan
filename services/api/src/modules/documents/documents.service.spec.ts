import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { CasesService } from '../cases/cases.service';
import { DocumentsService, safeFileName, validateFile } from './documents.service';
import { removeCaseStorage } from './document-storage';
import { DocumentsRepository } from './repositories/documents.repository';

describe('DocumentsService', () => {
  let storage: string;
  beforeEach(async () => { storage = await mkdtemp(join(tmpdir(), 'aizan-files-')); process.env.DOCUMENT_UPLOAD_DIR = storage; });
  afterEach(async () => { delete process.env.DOCUMENT_UPLOAD_DIR; await rm(storage, { recursive: true, force: true }); });
  it('creates upload session and document requiring OCR review', async () => {
    const service = new DocumentsService();
    const session = await service.createUploadSession({
      caseId: 'case-1',
      fileName: 'договор.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
    });
    await uploadFixture(service, session);
    const document = await service.completeUpload({ uploadSessionId: session.id });

    expect(document.status).toBe('ocr_review_required');
    expect(await service.listDocuments('case-1')).toHaveLength(1);
  });

  it('rejects completion without bytes, forged hash and mismatched content; downloads actual bytes', async () => {
    const service = new DocumentsService();
    const session = await service.createUploadSession({ caseId: 'case-1', fileName: 'real.pdf', mimeType: 'application/pdf', sizeBytes: 32 });
    await expect(service.completeUpload({ uploadSessionId: session.id })).rejects.toThrow('FILE_CONTENT_NOT_UPLOADED');
    const token = session.uploadUrl.split('/')[3]!;
    await expect(service.uploadContent(token, Buffer.alloc(32), 'application/pdf', '', session.id)).rejects.toThrow('FILE_SIGNATURE_INVALID');
    await uploadFixture(service, session);
    await expect(service.completeUpload({ uploadSessionId: session.id, sha256: 'forged' })).rejects.toThrow('FILE_HASH_MISMATCH');
    const document = await service.completeUpload({ uploadSessionId: session.id });
    expect((await service.downloadContent(document.id, '')).bytes.subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('isolates identical content across cases and erases only the deleted case namespace', async () => {
    const service = new DocumentsService();
    const first = await service.createUploadSession({ caseId: 'case-a', fileName: 'same.pdf', mimeType: 'application/pdf', sizeBytes: 32 });
    const second = await service.createUploadSession({ caseId: 'case-b', fileName: 'same.pdf', mimeType: 'application/pdf', sizeBytes: 32 });
    await uploadFixture(service, first); await uploadFixture(service, second);
    const a = await service.completeUpload({ uploadSessionId: first.id });
    const b = await service.completeUpload({ uploadSessionId: second.id });
    expect(a.id).not.toBe(b.id); expect(a.sha256).toBe(b.sha256);
    await removeCaseStorage('case-a');
    await expect(service.downloadContent(a.id, '')).rejects.toThrow('FILE_CONTENT_NOT_FOUND');
    expect((await service.downloadContent(b.id, '')).bytes.length).toBe(32);
  });

  it('confirms OCR fields and marks document ready', async () => {
    const service = new DocumentsService();
    const session = await service.createUploadSession({
      caseId: 'case-1',
      fileName: 'claim.png',
      mimeType: 'image/png',
      sizeBytes: 2048,
    });
    await uploadFixture(service, session);
    const document = await service.completeUpload({ uploadSessionId: session.id });
    const ready = await service.confirmOcr(document.id, { amount: '150000 ₸' });

    expect(ready.status).toBe('ready');
    expect(ready.extractedFields.amount).toBe('150000 ₸');
  });

  it('rejects unsafe file types and duplicate hashes', async () => {
    const service = new DocumentsService();
    expect(() => validateFile('virus.exe', 'application/octet-stream', 100)).toThrow(BadRequestException);
    const session = await service.createUploadSession({
      caseId: 'case-1',
      fileName: 'a.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 100,
    });
    await uploadFixture(service, session);
    const original = await service.completeUpload({ uploadSessionId: session.id });
    const duplicate = await service.createUploadSession({
      caseId: 'case-1',
      fileName: 'b.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 100,
    });
    await uploadFixture(service, duplicate);
    expect((await service.completeUpload({ uploadSessionId: duplicate.id })).id).toBe(original.id);
  });

  it('creates evidence folder with preliminary assessment', async () => {
    const service = new DocumentsService();
    const folder = await service.createEvidenceFolder({ caseId: 'case-1', title: 'Договор и переписка', documentIds: ['doc-1'] });

    expect(folder.assessment).toBe('possibly_admissible');
    expect(await service.listEvidence('case-1')).toHaveLength(1);
  });

  it('checks case ownership when owner header is provided', async () => {
    const cases = { getCase: jest.fn().mockRejectedValue(new ForbiddenException('CASE_ACCESS_DENIED')) } as unknown as CasesService;
    const service = new DocumentsService(undefined, cases);

    await expect(
      service.createUploadSession(
        {
          caseId: 'case-1',
          fileName: 'claim.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 1024,
        },
        'other-user',
      ),
    ).rejects.toThrow(ForbiddenException);
    expect(cases.getCase).toHaveBeenCalledWith('case-1', 'other-user');
  });

  it('normalizes unsafe filenames', () => {
    expect(safeFileName('../secret?.pdf')).toBe('.._secret_.pdf');
  });

  it('uses configured repository for persistent document flow', async () => {
    const repository = createRepositoryMock();
    const service = new DocumentsService(repository);

    const session = await service.createUploadSession({
      caseId: 'case-1',
      fileName: 'claim.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
    });
    const hash = await uploadFixture(service, session);
    const document = await service.completeUpload({ uploadSessionId: session.id, sha256: hash });
    await service.confirmOcr(document.id, { amount: '150000' });
    await service.createEvidenceFolder({ caseId: 'case-1', title: 'Доказательства', documentIds: [document.id] });

    expect(repository.createUploadSession).toHaveBeenCalled();
    expect(repository.findUploadSessionById).toHaveBeenCalledWith('upload-1');
    expect(repository.findDocumentBySha256).toHaveBeenCalledWith(hash, 'case-1');
    expect(repository.createDocument).toHaveBeenCalledWith(expect.objectContaining({ sha256: hash, status: 'ocr_review_required' }));
    expect(repository.updateDocumentOcr).toHaveBeenCalledWith({ documentId: 'doc-1', fields: { amount: '150000' }, status: 'ready' });
    expect(repository.createEvidenceFolder).toHaveBeenCalled();
  });

  it('uses repository for admin document review actions', async () => {
    const repository = createRepositoryMock();
    const service = new DocumentsService(repository);

    const queue = await service.adminListDocumentReviewQueue();
    const confirmed = await service.adminConfirmOcr('doc-1', { amount: '200000' });
    const rejected = await service.adminRejectDocument('doc-1', 'bad scan');

    expect(queue).toHaveLength(1);
    expect(repository.listDocumentsForAdminReview).toHaveBeenCalledWith(50);
    expect(repository.updateDocumentOcr).toHaveBeenCalledWith({ documentId: 'doc-1', fields: { amount: '200000' }, status: 'ready' });
    expect(confirmed.status).toBe('ready');
    expect(repository.updateDocumentOcr).toHaveBeenCalledWith({
      documentId: 'doc-1',
      fields: expect.objectContaining({ adminReviewReason: 'bad scan', adminReviewStatus: 'rejected' }),
      status: 'rejected',
    });
    expect(rejected.status).toBe('rejected');
  });
});

function createRepositoryMock(): jest.Mocked<DocumentsRepository> {
  const session = {
    id: 'upload-1',
    caseId: 'case-1',
    fileName: 'claim.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 1024,
    status: 'upload_pending' as const,
    uploadUrl: '/files/uploads/00000000-0000-4000-8000-000000000001/content',
    createdAt: new Date().toISOString(),
  };
  const document = {
    id: 'doc-1',
    caseId: 'case-1',
    fileName: 'claim.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 1024,
    sha256: 'hash-1',
    status: 'ocr_review_required' as const,
    extractedFields: { documentTitle: 'claim.pdf' },
    createdAt: new Date().toISOString(),
  };
  return {
    createUploadSession: jest.fn().mockResolvedValue(session),
    findUploadSessionById: jest.fn().mockResolvedValue(session),
    createDocument: jest.fn().mockResolvedValue(document),
    findDocumentById: jest.fn().mockResolvedValue(document),
    findDocumentBySha256: jest.fn().mockResolvedValue(undefined),
    listDocuments: jest.fn().mockResolvedValue([document]),
    listDocumentsForAdminReview: jest.fn().mockResolvedValue([document]),
    updateDocumentOcr: jest
      .fn()
      .mockImplementation(({ fields, status }) => Promise.resolve({ ...document, status, extractedFields: fields })),
    createEvidenceFolder: jest.fn().mockImplementation((folder) =>
      Promise.resolve({
        id: 'evidence-1',
        createdAt: new Date().toISOString(),
        ...folder,
      }),
    ),
    listEvidence: jest.fn().mockResolvedValue([]),
  };
}

async function uploadFixture(service: DocumentsService, session: { id: string; uploadUrl: string; sizeBytes: number; mimeType: string }) {
  const bytes = Buffer.alloc(session.sizeBytes);
  if (session.mimeType === 'image/png') Buffer.from([137,80,78,71,13,10,26,10]).copy(bytes);
  else bytes.write('%PDF-1.4');
  await service.uploadContent(session.uploadUrl.split('/')[3]!, bytes, session.mimeType, '', session.id);
  return createHash('sha256').update(bytes).digest('hex');
}
