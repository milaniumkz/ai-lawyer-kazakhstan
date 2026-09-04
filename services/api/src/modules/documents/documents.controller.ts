import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { DocumentsService } from './documents.service';

@Controller()
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Post('files/upload-sessions')
  createUploadSession(@Body() body: { caseId: string; fileName: string; mimeType: string; sizeBytes: number }, @Headers('x-user-id') userId = '') {
    return this.documents.createUploadSession(body, userId);
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

  @Post('evidence')
  createEvidence(@Body() body: { caseId: string; title: string; documentIds?: string[] }, @Headers('x-user-id') userId = '') {
    return this.documents.createEvidenceFolder(body, userId);
  }

  @Get('cases/:caseId/evidence')
  listEvidence(@Param('caseId') caseId: string, @Headers('x-user-id') userId = '') {
    return this.documents.listEvidence(caseId, userId);
  }
}
