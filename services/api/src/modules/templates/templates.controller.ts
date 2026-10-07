import { createDocumentPdf } from './document-pdf';
import type { FastifyReply } from 'fastify';
import { Body, Controller, Get, Headers, Param, Patch, Post, Res } from '@nestjs/common';
import { GenerationJobsService, GenerationInput } from './generation-jobs.service';
import { TemplatesService } from './templates.service';

@Controller()
export class TemplatesController {
  constructor(private readonly templates: TemplatesService, private readonly jobs: GenerationJobsService) {}

  @Post('documents/generation-jobs')
  enqueue(@Body() body: GenerationInput, @Headers('x-user-id') userId = '', @Headers('idempotency-key') key = '') { return this.jobs.enqueue(body,userId,key); }
  @Get('documents/generation-jobs/:jobId')
  getJob(@Param('jobId') id: string, @Headers('x-user-id') userId = '') { return this.jobs.get(id,userId); }
  @Post('documents/generation-jobs/:jobId/cancel')
  cancelJob(@Param('jobId') id: string, @Headers('x-user-id') userId = '') { return this.jobs.cancel(id,userId); }
  @Get('cases/:caseId/generation-jobs')
  listJobs(@Param('caseId') caseId: string, @Headers('x-user-id') userId = '') { return this.jobs.list(caseId,userId); }

  @Get('generated-documents/:documentId')
  getGenerated(@Param('documentId') id: string, @Headers('x-user-id') userId = '') { return this.templates.getGenerated(id,userId); }
  @Patch('generated-documents/:documentId')
  editGenerated(@Param('documentId') id: string, @Body() body: {body: string}, @Headers('x-user-id') userId = '') { return this.templates.editGenerated(id,body.body,userId); }

  @Get('generated-documents/:documentId/pdf')
  async pdf(@Param('documentId') id: string, @Headers('x-user-id') userId = '', @Res() response: FastifyReply) {
    const document = await this.templates.getGenerated(id,userId);
    response.header('content-type','application/pdf').header('content-disposition','attachment; filename="claim.pdf"').header('cache-control','no-store').header('x-content-type-options','nosniff');
    return response.send(await createDocumentPdf(document.body));
  }

  @Get('templates')
  listTemplates() {
    return this.templates.listTemplates();
  }

  @Post('documents/generate')
  generate(@Body() body: { templateId: string; caseId: string; fields: Record<string, string>; confirmedCitationIds?: string[] }, @Headers('x-user-id') userId = '') {
    return this.templates.generate(body, userId);
  }

  @Get('cases/:caseId/generated-documents')
  listGenerated(@Param('caseId') caseId: string, @Headers('x-user-id') userId = '') {
    return this.templates.listGenerated(caseId, userId);
  }
}
