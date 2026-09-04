import { GeneratedDocument, TemplateRecord } from '../templates.types';

export interface TemplatesRepository {
  listTemplates(): Promise<TemplateRecord[]>;
  findTemplateById(id: string): Promise<TemplateRecord | undefined>;
  createGeneratedDocument(input: Omit<GeneratedDocument, 'id' | 'createdAt'>): Promise<GeneratedDocument>;
  listGenerated(caseId: string): Promise<GeneratedDocument[]>;
}
