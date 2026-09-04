import { BadRequestException, Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { GeneratedDocument, TemplateRecord } from './templates.types';
import { TEMPLATES_REPOSITORY } from './repositories/templates-repository.provider';
import { TemplatesRepository } from './repositories/templates.repository';

const PRETRIAL_CLAIM_TEMPLATE: TemplateRecord = {
  id: 'tpl-pretrial-claim-ru-v1',
  code: 'pretrial_claim',
  title: 'Досудебная претензия',
  language: 'ru',
  status: 'expert_review',
  version: 'v1',
  requiredFields: ['claimantName', 'respondentName', 'claimAmount', 'claimReason', 'deadlineDate'],
  body:
    'Проект документа. Требует проверки и подтверждения пользователем.\n\n' +
    'От: {{claimantName}}\nКому: {{respondentName}}\n\n' +
    'Досудебная претензия\n\n' +
    'Основание требования: {{claimReason}}.\nСумма требования: {{claimAmount}} ₸.\n' +
    'Просим исполнить требование до {{deadlineDate}}.\n\n' +
    'Применимые нормы должны быть подтверждены официальными источниками РК перед отправкой.',
};

@Injectable()
export class TemplatesService {
  private readonly templates = new Map<string, TemplateRecord>([[PRETRIAL_CLAIM_TEMPLATE.id, PRETRIAL_CLAIM_TEMPLATE]]);
  private readonly generatedDocuments = new Map<string, GeneratedDocument>();

  constructor(@Optional() @Inject(TEMPLATES_REPOSITORY) private readonly repository?: TemplatesRepository) {}

  async listTemplates() {
    if (this.repository) return this.repository.listTemplates();
    return [...this.templates.values()];
  }

  async generate(input: { templateId: string; caseId: string; fields: Record<string, string>; confirmedCitationIds?: string[] }) {
    const template = this.repository ? await this.repository.findTemplateById(input.templateId) : this.templates.get(input.templateId);
    if (!template) throw new NotFoundException('TEMPLATE_NOT_FOUND');
    const missing = template.requiredFields.filter((field) => !input.fields[field]);
    if (missing.length) throw new BadRequestException({ code: 'REQUIRED_FIELDS_MISSING', missing });

    let body = template.body;
    for (const [key, value] of Object.entries(input.fields)) {
      body = body.replaceAll(`{{${key}}}`, value);
    }
    if (body.includes('{{')) throw new BadRequestException('UNRESOLVED_PLACEHOLDERS');

    const document: GeneratedDocument = {
      id: randomUUID(),
      templateId: template.id,
      caseId: input.caseId,
      status: 'draft_requires_user_confirmation',
      title: template.title,
      body,
      expertReviewRequired: template.status !== 'published' || !(input.confirmedCitationIds?.length),
      createdAt: new Date().toISOString(),
    };
    if (this.repository) return this.repository.createGeneratedDocument(document);
    this.generatedDocuments.set(document.id, document);
    return document;
  }

  async listGenerated(caseId: string) {
    if (this.repository) return this.repository.listGenerated(caseId);
    return [...this.generatedDocuments.values()].filter((document) => document.caseId === caseId);
  }
}
