import { Body, Controller, Get, Headers, Param, Post, Req, Res } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import type { MultipartFile } from '@fastify/multipart';
import { assertAdminRole } from '../../common/admin-rbac';
import { DocumentsService } from './documents.service';

@Controller()
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Post('files/upload-sessions')
  createUploadSession(@Body() body: { caseId: string; fileName: string; mimeType: string; sizeBytes: number }, @Headers('x-user-id') userId = '') {
    return this.documents.createUploadSession(body, userId);
  }

  @Post('files/uploads/:token/content')
  async uploadContent(@Param('token') token: string, @Req() request: { file(): Promise<MultipartFile | undefined> }, @Headers('x-user-id') userId = '', @Headers('x-upload-session-id') sessionId = '') {
    const file = await request.file();
    const bytes = file ? await file.toBuffer() : Buffer.alloc(0);
    return this.documents.uploadContent(token, bytes, file?.mimetype ?? '', userId, sessionId);
  }

  @Get('documents/:documentId/content')
  async downloadContent(@Param('documentId') documentId: string, @Headers('x-user-id') userId = '', @Res() response: FastifyReply) {
    const { document, bytes } = await this.documents.downloadContent(documentId, userId);
    response.header('Content-Type', document.mimeType);
    response.header('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(document.fileName)}`);
    response.header('X-Content-Type-Options', 'nosniff');
    response.header('Cache-Control', 'private, no-store');
    return response.send(bytes);
  }

  @Post('files/complete')
  completeUpload(@Body() body: { uploadSessionId: string; sha256?: string }, @Headers('x-user-id') userId = '') {
    return this.documents.completeUpload(body, userId);
  }

  @Get('cases/:caseId/documents')
  listDocuments(@Param('caseId') caseId: string, @Headers('x-user-id') userId = '') {
    return this.documents.listDocuments(caseId, userId);
  }

  @Post('documents/:documentId/ocr-confirm')
  confirmOcr(@Param('documentId') documentId: string, @Body() body: { fields: Record<string, string> }, @Headers('x-user-id') userId = '') {
    return this.documents.confirmOcr(documentId, body.fields, userId);
  }

  @Get('admin/documents/review-queue')
  adminDocumentReviewQueue(@Headers('x-user-role') userRole?: string | string[]) {
    assertAdminRole(userRole);
    return this.documents.adminListDocumentReviewQueue();
  }

  @Post('admin/documents/:documentId/ocr-confirm')
  adminConfirmOcr(@Param('documentId') documentId: string, @Body() body: { fields?: Record<string, string> } = {}, @Headers('x-user-role') userRole?: string | string[]) {
    assertAdminRole(userRole);
    return this.documents.adminConfirmOcr(documentId, body.fields ?? {});
  }

  @Post('admin/documents/:documentId/reject')
  adminRejectDocument(@Param('documentId') documentId: string, @Body() body: { reason?: string } = {}, @Headers('x-user-role') userRole?: string | string[]) {
    assertAdminRole(userRole);
    return this.documents.adminRejectDocument(documentId, body.reason);
  }

  @Post('evidence')
  createEvidence(@Body() body: { caseId: string; title: string; documentIds?: string[] }, @Headers('x-user-id') userId = '') {
    return this.documents.createEvidenceFolder(body, userId);
  }

  @Get('cases/:caseId/evidence')
  listEvidence(@Param('caseId') caseId: string, @Headers('x-user-id') userId = '') {
    return this.documents.listEvidence(caseId, userId);
  }
}
