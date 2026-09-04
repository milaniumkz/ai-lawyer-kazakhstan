import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { DocumentsService } from './documents.service';

@Controller()
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Post('files/upload-sessions')
  createUploadSession(@Body() body: { caseId: string; fileName: string; mimeType: string; sizeBytes: number }) {
    return this.documents.createUploadSession(body);
  }

  @Post('files/complete')
  completeUpload(@Body() body: { uploadSessionId: string; sha256?: string }) {
    return this.documents.completeUpload(body);
  }

  @Get('cases/:caseId/documents')
  listDocuments(@Param('caseId') caseId: string) {
    return this.documents.listDocuments(caseId);
  }

  @Post('documents/:documentId/ocr-confirm')
  confirmOcr(@Param('documentId') documentId: string, @Body() body: { fields: Record<string, string> }) {
    return this.documents.confirmOcr(documentId, body.fields);
  }

  @Post('evidence')
  createEvidence(@Body() body: { caseId: string; title: string; documentIds?: string[] }) {
    return this.documents.createEvidenceFolder(body);
  }

  @Get('cases/:caseId/evidence')
  listEvidence(@Param('caseId') caseId: string) {
    return this.documents.listEvidence(caseId);
  }
}
