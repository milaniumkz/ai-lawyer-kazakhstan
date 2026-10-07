import { BadRequestException, Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CasesService } from '../cases/cases.service';
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

  constructor(
    @Optional() @Inject(TEMPLATES_REPOSITORY) private readonly repository?: TemplatesRepository,
    @Optional() private readonly cases?: CasesService,
  ) {}

  async listTemplates() {
    if (this.repository) return this.repository.listTemplates();
    return [...this.templates.values()];
  }

  async generate(input: { templateId: string; caseId: string; fields: Record<string, string>; confirmedCitationIds?: string[] }, ownerUserId?: string) {
    const document = await this.buildDocument(input, ownerUserId);
    if (this.repository) return this.repository.createGeneratedDocument(document);
    this.generatedDocuments.set(document.id, document);
    return document;
  }

  storeLocalDocument(document: GeneratedDocument) { this.generatedDocuments.set(document.id, document); }

  async buildDocument(input: { templateId: string; caseId: string; fields: Record<string, string>; confirmedCitationIds?: string[] }, ownerUserId?: string) {
    await this.assertCaseOwner(input.caseId, ownerUserId);
    const template = this.repository ? await this.repository.findTemplateById(input.templateId) : this.templates.get(input.templateId);
    if (!template) throw new NotFoundException('TEMPLATE_NOT_FOUND');
    if (!input.fields || typeof input.fields !== 'object' || Object.values(input.fields).some(value => typeof value !== 'string' || value.length > 20000)) throw new BadRequestException('DOCUMENT_FIELDS_INVALID');
    const missing = template.requiredFields.filter((field) => !input.fields[field]);
    if (missing.length) throw new BadRequestException({ code: 'REQUIRED_FIELDS_MISSING', missing });
    const absent = template.requiredFields.filter((field) => !template.body.includes(`{{${field}}}`));
    if (absent.length) throw new BadRequestException({ code: 'TEMPLATE_INCOMPLETE', message: 'Шаблон не содержит обязательные поля документа', missing: absent });

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
    return document;
  }

  async listGenerated(caseId: string, ownerUserId?: string) {
    await this.assertCaseOwner(caseId, ownerUserId);
    if (this.repository) return this.repository.listGenerated(caseId);
    return [...this.generatedDocuments.values()].filter((document) => document.caseId === caseId);
  }

  async getGenerated(id: string, ownerUserId: string) {
    const document = this.repository ? await this.repository.findGenerated(id) : this.generatedDocuments.get(id);
    if (!document) throw new NotFoundException('GENERATED_DOCUMENT_NOT_FOUND');
    await this.assertCaseOwner(document.caseId, ownerUserId);
    return document;
  }
  async editGenerated(id: string, body: string, ownerUserId: string) {
    if (typeof body !== 'string' || !body.trim() || body.length > 100000) throw new BadRequestException('DOCUMENT_BODY_INVALID');
    const document = await this.getGenerated(id, ownerUserId);
    if (this.repository) return this.repository.updateGenerated(id, body);
    Object.assign(document,{body, status:'draft_requires_user_confirmation', expertReviewRequired:true});
    return document;
  }

  private async assertCaseOwner(caseId: string, ownerUserId?: string) {
    if (ownerUserId === undefined || !this.cases) return;
    await this.cases.getCase(caseId, ownerUserId);
  }
}
