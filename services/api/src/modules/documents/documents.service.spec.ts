import { BadRequestException } from '@nestjs/common';
import { DocumentsService, safeFileName, validateFile } from './documents.service';

describe('DocumentsService', () => {
  it('creates upload session and document requiring OCR review', () => {
    const service = new DocumentsService();
    const session = service.createUploadSession({
      caseId: 'case-1',
      fileName: 'договор.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
    });
    const document = service.completeUpload({ uploadSessionId: session.id });

    expect(document.status).toBe('ocr_review_required');
    expect(service.listDocuments('case-1')).toHaveLength(1);
  });

  it('confirms OCR fields and marks document ready', () => {
    const service = new DocumentsService();
    const session = service.createUploadSession({
      caseId: 'case-1',
      fileName: 'claim.png',
      mimeType: 'image/png',
      sizeBytes: 2048,
    });
    const document = service.completeUpload({ uploadSessionId: session.id });
    const ready = service.confirmOcr(document.id, { amount: '150000 ₸' });

    expect(ready.status).toBe('ready');
    expect(ready.extractedFields.amount).toBe('150000 ₸');
  });

  it('rejects unsafe file types and duplicate hashes', () => {
    const service = new DocumentsService();
    expect(() => validateFile('virus.exe', 'application/octet-stream', 100)).toThrow(BadRequestException);
    const session = service.createUploadSession({
      caseId: 'case-1',
      fileName: 'a.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 100,
    });
    service.completeUpload({ uploadSessionId: session.id, sha256: 'same' });
    const duplicate = service.createUploadSession({
      caseId: 'case-1',
      fileName: 'b.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 100,
    });
    expect(() => service.completeUpload({ uploadSessionId: duplicate.id, sha256: 'same' })).toThrow(BadRequestException);
  });

  it('creates evidence folder with preliminary assessment', () => {
    const service = new DocumentsService();
    const folder = service.createEvidenceFolder({ caseId: 'case-1', title: 'Договор и переписка', documentIds: ['doc-1'] });

    expect(folder.assessment).toBe('possibly_admissible');
    expect(service.listEvidence('case-1')).toHaveLength(1);
  });

  it('normalizes unsafe filenames', () => {
    expect(safeFileName('../secret?.pdf')).toBe('.._secret_.pdf');
  });
});
