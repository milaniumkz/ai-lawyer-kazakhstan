import { DatabaseService } from '../../../common/database/database.service';
import { PostgresDocumentsRepository, mapDocument, mapEvidenceFolder, mapUploadSession } from './postgres-documents.repository';

describe('PostgresDocumentsRepository mapping', () => {
  it('maps upload sessions and documents from database columns', () => {
    expect(mapUploadSession(uploadSessionRow())).toMatchObject({
      caseId: 'case-1',
      fileName: 'claim.pdf',
      sizeBytes: 1200,
      status: 'upload_pending',
    });

    expect(mapDocument(documentRow())).toMatchObject({
      caseId: 'case-1',
      sha256: 'abc123',
      extractedFields: { documentTitle: 'claim.pdf' },
    });
  });

  it('maps evidence folders with document ids', () => {
    expect(mapEvidenceFolder(evidenceRow())).toMatchObject({
      caseId: 'case-1',
      assessment: 'possibly_admissible',
      documentIds: ['doc-1'],
    });
  });
});

describe('PostgresDocumentsRepository persistence contract', () => {
  it('creates upload sessions in dedicated upload_sessions table', async () => {
    const { db, query } = createDbMock(uploadSessionRow());
    const repository = new PostgresDocumentsRepository(db);

    await repository.createUploadSession({
      caseId: 'case-1',
      fileName: 'claim.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1200,
      status: 'upload_pending',
      uploadUrl: 'stub://upload/fixture',
    });

    expect(query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO upload_sessions'), [
      'case-1',
      'claim.pdf',
      'application/pdf',
      1200,
      'upload_pending',
      'stub://upload/fixture',
    ]);
  });

  it('creates document metadata in files table with OCR fields as JSON', async () => {
    const { db, query } = createDbMock(documentRow());
    const repository = new PostgresDocumentsRepository(db);

    await repository.createDocument({
      caseId: 'case-1',
      fileName: 'claim.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1200,
      sha256: 'abc123',
      status: 'ocr_review_required',
      extractedFields: { documentTitle: 'claim.pdf' },
    });

    expect(query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO files'), [
      'case-1',
      'claim.pdf',
      'application/pdf',
      1200,
      'abc123',
      'ocr_review_required',
      { documentTitle: 'claim.pdf' },
    ]);
  });

  it('updates OCR review state without replacing the stored document hash', async () => {
    const { db, query } = createDbMock({ ...documentRow(), status: 'ready', extracted_fields: { confirmed: 'true' } });
    const repository = new PostgresDocumentsRepository(db);

    await repository.updateDocumentOcr({ documentId: 'doc-1', fields: { confirmed: 'true' }, status: 'ready' });

    expect(query).toHaveBeenCalledWith(expect.stringContaining('UPDATE files SET extracted_fields'), ['doc-1', { confirmed: 'true' }, 'ready']);
    expect(query.mock.calls[0][0]).not.toContain('sha256');
  });
});

function createDbMock(row: unknown) {
  const query = jest.fn().mockResolvedValue({ rows: row ? [row] : [] });
  return {
    db: { query } as unknown as DatabaseService,
    query,
  };
}

function uploadSessionRow() {
  return {
    id: 'upload-1',
    case_id: 'case-1',
    file_name: 'claim.pdf',
    mime_type: 'application/pdf',
    size_bytes: '1200',
    status: 'upload_pending' as const,
    upload_url: 'stub://upload/fixture',
    created_at: new Date('2026-09-04T00:00:00.000Z'),
  };
}

function documentRow() {
  return {
    id: 'doc-1',
    case_id: 'case-1',
    file_name: 'claim.pdf',
    mime_type: 'application/pdf',
    size_bytes: '1200',
    sha256: 'abc123',
    status: 'ocr_review_required' as const,
    extracted_fields: { documentTitle: 'claim.pdf' },
    created_at: new Date('2026-09-04T00:00:00.000Z'),
  };
}

function evidenceRow() {
  return {
    id: 'evidence-1',
    case_id: 'case-1',
    title: 'Доказательства долга',
    assessment: 'possibly_admissible' as const,
    document_ids: ['doc-1'],
    created_at: new Date('2026-09-04T00:00:00.000Z'),
  };
}
