import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../common/database/database.service';
import { DocumentRecord, EvidenceFolder, UploadSession } from '../documents.types';
import { DocumentsRepository } from './documents.repository';

@Injectable()
export class PostgresDocumentsRepository implements DocumentsRepository {
  constructor(private readonly db: DatabaseService) {}

  async createUploadSession(input: Omit<UploadSession, 'id' | 'createdAt'>) {
    const result = await this.db.query<UploadSessionRow>(
      `INSERT INTO upload_sessions (case_id, file_name, mime_type, size_bytes, status, upload_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [input.caseId, input.fileName, input.mimeType, input.sizeBytes, input.status, input.uploadUrl],
    );
    return mapUploadSession(result.rows[0]!);
  }

  async findUploadSessionById(id: string) {
    const result = await this.db.query<UploadSessionRow>('SELECT * FROM upload_sessions WHERE id = $1 LIMIT 1', [id]);
    return result.rows[0] ? mapUploadSession(result.rows[0]) : undefined;
  }

  async createDocument(input: Omit<DocumentRecord, 'id' | 'createdAt'>) {
    const result = await this.db.query<DocumentRow>(
      `INSERT INTO files (case_id, file_name, mime_type, size_bytes, sha256, status, extracted_fields)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [input.caseId, input.fileName, input.mimeType, input.sizeBytes, input.sha256, input.status, input.extractedFields],
    );
    return mapDocument(result.rows[0]!);
  }

  async findDocumentById(id: string) {
    const result = await this.db.query<DocumentRow>('SELECT * FROM files WHERE id = $1 LIMIT 1', [id]);
    return result.rows[0] ? mapDocument(result.rows[0]) : undefined;
  }

  async findDocumentBySha256(sha256: string) {
    const result = await this.db.query<DocumentRow>('SELECT * FROM files WHERE sha256 = $1 LIMIT 1', [sha256]);
    return result.rows[0] ? mapDocument(result.rows[0]) : undefined;
  }

  async listDocuments(caseId: string) {
    const result = await this.db.query<DocumentRow>('SELECT * FROM files WHERE case_id = $1 ORDER BY created_at DESC', [caseId]);
    return result.rows.map(mapDocument);
  }

  async updateDocumentOcr(input: { documentId: string; fields: Record<string, string>; status: DocumentRecord['status'] }) {
    const result = await this.db.query<DocumentRow>(
      'UPDATE files SET extracted_fields = $2, status = $3 WHERE id = $1 RETURNING *',
      [input.documentId, input.fields, input.status],
    );
    return mapDocument(result.rows[0]!);
  }

  async createEvidenceFolder(input: Omit<EvidenceFolder, 'id' | 'createdAt'>) {
    const result = await this.db.query<EvidenceFolderRow>(
      `INSERT INTO evidence_folders (case_id, title, assessment, document_ids)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [input.caseId, input.title, input.assessment, input.documentIds],
    );
    return mapEvidenceFolder(result.rows[0]!);
  }

  async listEvidence(caseId: string) {
    const result = await this.db.query<EvidenceFolderRow>('SELECT * FROM evidence_folders WHERE case_id = $1 ORDER BY created_at DESC', [caseId]);
    return result.rows.map(mapEvidenceFolder);
  }
}

interface UploadSessionRow {
  id: string;
  case_id: string;
  file_name: string;
  mime_type: string;
  size_bytes: string | number;
  status: UploadSession['status'];
  upload_url: string;
  created_at: Date;
}

interface DocumentRow {
  id: string;
  case_id: string;
  file_name: string;
  mime_type: string;
  size_bytes: string | number;
  sha256: string;
  status: DocumentRecord['status'];
  extracted_fields: Record<string, string>;
  created_at: Date;
}

interface EvidenceFolderRow {
  id: string;
  case_id: string;
  title: string;
  assessment: EvidenceFolder['assessment'];
  document_ids: string[];
  created_at: Date;
}

export function mapUploadSession(row: UploadSessionRow): UploadSession {
  return {
    id: row.id,
    caseId: row.case_id,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes),
    status: row.status,
    uploadUrl: row.upload_url,
    createdAt: row.created_at.toISOString(),
  };
}

export function mapDocument(row: DocumentRow): DocumentRecord {
  return {
    id: row.id,
    caseId: row.case_id,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes),
    sha256: row.sha256,
    status: row.status,
    extractedFields: row.extracted_fields,
    createdAt: row.created_at.toISOString(),
  };
}

export function mapEvidenceFolder(row: EvidenceFolderRow): EvidenceFolder {
  return {
    id: row.id,
    caseId: row.case_id,
    title: row.title,
    assessment: row.assessment,
    documentIds: row.document_ids,
    createdAt: row.created_at.toISOString(),
  };
}
