import { BadRequestException } from '@nestjs/common';
import { DocumentsService, safeFileName, validateFile } from './documents.service';
import { DocumentsRepository } from './repositories/documents.repository';

describe('DocumentsService', () => {
  it('creates upload session and document requiring OCR review', async () => {
    const service = new DocumentsService();
    const session = await service.createUploadSession({
      caseId: 'case-1',
      fileName: 'договор.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
    });
    const document = await service.completeUpload({ uploadSessionId: session.id });

    expect(document.status).toBe('ocr_review_required');
    expect(await service.listDocuments('case-1')).toHaveLength(1);
  });

  it('confirms OCR fields and marks document ready', async () => {
    const service = new DocumentsService();
    const session = await service.createUploadSession({
      caseId: 'case-1',
      fileName: 'claim.png',
      mimeType: 'image/png',
      sizeBytes: 2048,
    });
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
    await service.completeUpload({ uploadSessionId: session.id, sha256: 'same' });
    const duplicate = await service.createUploadSession({
      caseId: 'case-1',
      fileName: 'b.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 100,
    });
    await expect(service.completeUpload({ uploadSessionId: duplicate.id, sha256: 'same' })).rejects.toThrow(BadRequestException);
  });

  it('creates evidence folder with preliminary assessment', async () => {
    const service = new DocumentsService();
    const folder = await service.createEvidenceFolder({ caseId: 'case-1', title: 'Договор и переписка', documentIds: ['doc-1'] });

    expect(folder.assessment).toBe('possibly_admissible');
    expect(await service.listEvidence('case-1')).toHaveLength(1);
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
    const document = await service.completeUpload({ uploadSessionId: session.id, sha256: 'hash-1' });
    await service.confirmOcr(document.id, { amount: '150000' });
    await service.createEvidenceFolder({ caseId: 'case-1', title: 'Доказательства', documentIds: [document.id] });

    expect(repository.createUploadSession).toHaveBeenCalled();
    expect(repository.findUploadSessionById).toHaveBeenCalledWith('upload-1');
    expect(repository.findDocumentBySha256).toHaveBeenCalledWith('hash-1');
    expect(repository.createDocument).toHaveBeenCalledWith(expect.objectContaining({ sha256: 'hash-1', status: 'ocr_review_required' }));
    expect(repository.updateDocumentOcr).toHaveBeenCalledWith({ documentId: 'doc-1', fields: { amount: '150000' }, status: 'ready' });
    expect(repository.createEvidenceFolder).toHaveBeenCalled();
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
    uploadUrl: 'stub://upload/fixture',
    createdAt: '2026-09-04T00:00:00.000Z',
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
    createdAt: '2026-09-04T00:00:00.000Z',
  };
  return {
    createUploadSession: jest.fn().mockResolvedValue(session),
    findUploadSessionById: jest.fn().mockResolvedValue(session),
    createDocument: jest.fn().mockResolvedValue(document),
    findDocumentById: jest.fn().mockResolvedValue(document),
    findDocumentBySha256: jest.fn().mockResolvedValue(undefined),
    listDocuments: jest.fn().mockResolvedValue([document]),
    updateDocumentOcr: jest.fn().mockResolvedValue({ ...document, status: 'ready', extractedFields: { amount: '150000' } }),
    createEvidenceFolder: jest.fn().mockImplementation((folder) =>
      Promise.resolve({
        id: 'evidence-1',
        createdAt: '2026-09-04T00:00:00.000Z',
        ...folder,
      }),
    ),
    listEvidence: jest.fn().mockResolvedValue([]),
  };
}
