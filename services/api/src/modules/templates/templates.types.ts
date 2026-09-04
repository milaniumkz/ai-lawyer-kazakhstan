export type TemplateStatus = 'draft' | 'expert_review' | 'approved' | 'published' | 'archived';
export type GeneratedDocumentStatus = 'draft_requires_user_confirmation' | 'review_required' | 'expert_approved';

export interface TemplateRecord {
  id: string;
  code: string;
  title: string;
  language: 'ru' | 'kk' | 'en';
  status: TemplateStatus;
  version: string;
  requiredFields: string[];
  body: string;
}

export interface GeneratedDocument {
  id: string;
  templateId: string;
  caseId: string;
  status: GeneratedDocumentStatus;
  title: string;
  body: string;
  expertReviewRequired: boolean;
  createdAt: string;
}
