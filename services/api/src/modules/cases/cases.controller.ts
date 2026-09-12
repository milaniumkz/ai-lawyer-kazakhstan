import { Body, Controller, Get, Headers, Param, Post, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { assertAdminRole } from '../../common/admin-rbac';
import { assertSameUser, assertUserId } from '../../common/user-context';
import { CasesService } from './cases.service';

type MultipartField = { value?: unknown };
type MultipartFile = {
  filename: string;
  mimetype: string;
  fields: Record<string, unknown>;
  toBuffer: () => Promise<Buffer>;
};
type MultipartRequest = FastifyRequest & { file: () => Promise<MultipartFile | undefined> };

@Controller()
export class CasesController {
  constructor(private readonly cases: CasesService) {}

  @Post('cases')
  createCase(
    @Body() body: { ownerUserId: string; profileId?: string; problemText: string },
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-user-id') userId?: string | string[],
  ) {
    assertSameUser(userId, body.ownerUserId);
    return this.cases.createCase(body, idempotencyKey);
  }

  @Get('cases')
  listCases(@Headers('x-user-id') userId?: string | string[]) {
    return this.cases.listCases(assertUserId(userId));
  }

  @Get('case-categories')
  listCategories(@Headers('x-user-id') userId?: string | string[]) {
    assertUserId(userId);
    return this.cases.listCategories();
  }

  @Get('legal-categories')
  listLegalCategories(@Headers('x-user-id') userId?: string | string[]) {
    assertUserId(userId);
    return this.cases.listLegalCategories();
  }

  @Get('legal-categories/tree')
  listLegalCategoryTree(@Headers('x-user-id') userId?: string | string[]) {
    assertUserId(userId);
    return this.cases.listLegalCategoryTree();
  }

  @Get('admin/legal-categories')
  adminListLegalCategoryTree(@Headers('x-user-role') userRole?: string | string[]) {
    assertAdminRole(userRole);
    return this.cases.listLegalCategoryTree();
  }

  @Post('admin/legal-categories/change-requests')
  adminCreateLegalCategoryChangeRequest(
    @Body() body: LegalCategoryChangeRequestBody,
    @Headers('x-user-role') userRole?: string | string[],
  ) {
    assertAdminRole(userRole);
    return this.cases.adminCreateLegalCategoryChangeRequest(body, Array.isArray(userRole) ? userRole[0] : userRole ?? 'admin');
  }

  @Get('admin/legal-categories/change-requests')
  adminListLegalCategoryChangeRequests(@Headers('x-user-role') userRole?: string | string[]) {
    assertAdminRole(userRole);
    return this.cases.adminListLegalCategoryChangeRequests();
  }

  @Post('admin/legal-categories/change-requests/:id/approve')
  adminApproveLegalCategoryChangeRequest(@Param('id') id: string, @Headers('x-user-role') userRole?: string | string[]) {
    assertAdminRole(userRole);
    return this.cases.adminApproveLegalCategoryChangeRequest(id, Array.isArray(userRole) ? userRole[0] : userRole ?? 'admin');
  }

  @Post('admin/legal-categories/change-requests/:id/reject')
  adminRejectLegalCategoryChangeRequest(@Param('id') id: string, @Body() body: { reason?: string }, @Headers('x-user-role') userRole?: string | string[]) {
    assertAdminRole(userRole);
    return this.cases.adminRejectLegalCategoryChangeRequest(id, body?.reason, Array.isArray(userRole) ? userRole[0] : userRole ?? 'admin');
  }

  @Get('cases/:caseId')
  getCase(@Param('caseId') caseId: string, @Headers('x-user-id') userId?: string | string[]) {
    return this.cases.getCase(caseId, assertUserId(userId));
  }

  @Get('cases/:caseId/classification')
  getCaseClassification(@Param('caseId') caseId: string, @Headers('x-user-id') userId?: string | string[]) {
    return this.cases.getCaseClassification(caseId, assertUserId(userId));
  }

  @Post('ai/classifications')
  classifyDispute(
    @Body() body: { caseId?: string; conversationId?: string; inputMessageId?: string; text: string },
    @Headers('x-user-id') userId?: string | string[],
  ) {
    return this.cases.classifyDispute(body, assertUserId(userId));
  }

  @Get('ai/classifications/:id')
  getClassification(@Param('id') id: string, @Headers('x-user-id') userId?: string | string[]) {
    return this.cases.getClassification(id, assertUserId(userId));
  }

  @Post('ai/classifications/:id/clarifications')
  answerClarifications(@Param('id') id: string, @Body() body: { answers: Record<string, unknown> }, @Headers('x-user-id') userId?: string | string[]) {
    return this.cases.answerClarifications(id, body, assertUserId(userId));
  }

  @Post('ai/classifications/:id/confirm')
  confirmClassification(@Param('id') id: string, @Headers('idempotency-key') idempotencyKey?: string, @Headers('x-user-id') userId?: string | string[]) {
    void idempotencyKey;
    return this.cases.confirmClassification(id, assertUserId(userId));
  }

  @Post('ai/classifications/:id/override')
  overrideClassification(@Param('id') id: string, @Body() body: { subcategoryCode: string; reason?: string }, @Headers('x-user-id') userId?: string | string[]) {
    return this.cases.overrideClassification(id, body, assertUserId(userId));
  }

  @Get('admin/classifications/review-queue')
  adminClassificationReviewQueue(@Headers('x-user-role') userRole?: string | string[]) {
    assertAdminRole(userRole);
    return this.cases.adminListClassificationReviewQueue();
  }

  @Post('admin/classifications/:id/confirm')
  adminConfirmClassification(@Param('id') id: string, @Headers('x-user-role') userRole?: string | string[]) {
    assertAdminRole(userRole);
    return this.cases.adminConfirmClassification(id);
  }

  @Post('admin/classifications/:id/override')
  adminOverrideClassification(@Param('id') id: string, @Body() body: { subcategoryCode: string; reason?: string }, @Headers('x-user-role') userRole?: string | string[]) {
    assertAdminRole(userRole);
    return this.cases.adminOverrideClassification(id, body);
  }

  @Post('cases/:caseId/messages')
  addMessage(@Param('caseId') caseId: string, @Body() body: { role: 'user' | 'assistant'; text: string }, @Headers('x-user-id') userId?: string | string[]) {
    return this.cases.addMessage(caseId, body, assertUserId(userId));
  }

  @Get('cases/:caseId/messages')
  listMessages(@Param('caseId') caseId: string, @Headers('x-user-id') userId?: string | string[]) {
    return this.cases.listMessages(caseId, assertUserId(userId));
  }

  @Post('voice/transcripts')
  createTranscript(@Body() body: { caseId?: string; language?: 'ru' | 'kk' | 'en'; audioRef?: string; text?: string }, @Headers('x-user-id') userId?: string | string[]) {
    return this.cases.createTranscript(body, assertUserId(userId));
  }

  @Post('voice/transcripts/audio')
  async createAudioTranscript(
    @Req() request: MultipartRequest,
    @Headers('x-user-id') userId?: string | string[],
  ) {
    const part = await request.file();
    const buffer = await part?.toBuffer();
    const body = {
      caseId: stringField(part?.fields.caseId as MultipartField | undefined),
      language: languageField(part?.fields.language as MultipartField | undefined),
      text: stringField(part?.fields.text as MultipartField | undefined),
    };
    const file = buffer && part ? { originalname: part.filename, mimetype: part.mimetype, size: buffer.length, buffer } : undefined;
    return this.cases.createTranscriptFromAudio(body, file, assertUserId(userId));
  }

  @Get('voice/transcripts/:id')
  getTranscript(@Param('id') id: string, @Headers('x-user-id') userId?: string | string[]) {
    return this.cases.getTranscript(id, assertUserId(userId));
  }
}

function stringField(field?: MultipartField) {
  return typeof field?.value === 'string' ? field.value : undefined;
}

function languageField(field?: MultipartField): 'ru' | 'kk' | 'en' | undefined {
  const value = stringField(field);
  return value === 'ru' || value === 'kk' || value === 'en' ? value : undefined;
}

type LegalCategoryChangeRequestBody = {
  action: 'create' | 'update';
  categoryCode: string;
  payload: {
    code?: string;
    parentCode?: string;
    nameRu?: string;
    nameKk?: string;
    nameEn?: string;
    descriptionRu?: string;
    descriptionKk?: string;
    descriptionEn?: string;
    active?: boolean;
    highRisk?: boolean;
    sortOrder?: number;
    requiredFactSchema?: Record<string, unknown>;
    requiredDocumentRules?: Record<string, unknown>;
    clarificationQuestionTemplates?: Record<string, unknown>[];
    defaultLegalRoute?: 'civil' | 'administrative' | 'enforcement' | 'criminal_high_risk' | 'manual_review';
  };
  reason?: string;
};
