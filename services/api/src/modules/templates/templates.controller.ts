import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { TemplatesService } from './templates.service';

@Controller()
export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

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
