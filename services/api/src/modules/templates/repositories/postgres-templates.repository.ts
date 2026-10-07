import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../common/database/database.service';
import { GeneratedDocument, TemplateRecord } from '../templates.types';
import { TemplatesRepository } from './templates.repository';

@Injectable()
export class PostgresTemplatesRepository implements TemplatesRepository {
  constructor(private readonly db: DatabaseService) {}

  async listTemplates() {
    const result = await this.db.query<TemplateRow>('SELECT * FROM templates WHERE status <> $1 ORDER BY code, version DESC', ['archived']);
    return result.rows.map(mapTemplate);
  }

  async findTemplateById(id: string) {
    const result = await this.db.query<TemplateRow>('SELECT * FROM templates WHERE id = $1 LIMIT 1', [id]);
    return result.rows[0] ? mapTemplate(result.rows[0]) : undefined;
  }

  async createGeneratedDocument(input: Omit<GeneratedDocument, 'id' | 'createdAt'>) {
    const result = await this.db.query<GeneratedDocumentRow>(
      `INSERT INTO generated_documents (template_id, case_id, status, title, body, expert_review_required)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [input.templateId, input.caseId, input.status, input.title, input.body, input.expertReviewRequired],
    );
    return mapGeneratedDocument(result.rows[0]!);
  }

  async findGenerated(id: string) {
    const result = await this.db.query<GeneratedDocumentRow>('SELECT * FROM generated_documents WHERE id=$1',[id]);
    return result.rows[0] ? mapGeneratedDocument(result.rows[0]) : undefined;
  }
  async updateGenerated(id: string, body: string) {
    const result = await this.db.query<GeneratedDocumentRow>("UPDATE generated_documents SET body=$2, status='draft_requires_user_confirmation', expert_review_required=true WHERE id=$1 RETURNING *",[id,body]);
    return mapGeneratedDocument(result.rows[0]!);
  }
  async listGenerated(caseId: string) {
    const result = await this.db.query<GeneratedDocumentRow>(
      'SELECT * FROM generated_documents WHERE case_id = $1 ORDER BY created_at DESC',
      [caseId],
    );
    return result.rows.map(mapGeneratedDocument);
  }
}

interface TemplateRow {
  id: string;
  code: string;
  title: string;
  language: TemplateRecord['language'];
  status: TemplateRecord['status'];
  version: string;
  required_fields: string[];
  body: string;
}

interface GeneratedDocumentRow {
  id: string;
  template_id: string;
  case_id: string;
  status: GeneratedDocument['status'];
  title: string;
  body: string;
  expert_review_required: boolean;
  created_at: Date;
}

export function mapTemplate(row: TemplateRow): TemplateRecord {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    language: row.language,
    status: row.status,
    version: row.version,
    requiredFields: row.required_fields,
    body: row.body,
  };
}

export function mapGeneratedDocument(row: GeneratedDocumentRow): GeneratedDocument {
  return {
    id: row.id,
    templateId: row.template_id,
    caseId: row.case_id,
    status: row.status,
    title: row.title,
    body: row.body,
    expertReviewRequired: row.expert_review_required,
    createdAt: row.created_at.toISOString(),
  };
}
