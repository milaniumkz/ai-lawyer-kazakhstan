import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { TemplatesService } from './templates.service';

@Controller()
export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  @Get('templates')
  listTemplates() {
    return this.templates.listTemplates();
  }

  @Post('documents/generate')
  generate(@Body() body: { templateId: string; caseId: string; fields: Record<string, string>; confirmedCitationIds?: string[] }) {
    return this.templates.generate(body);
  }

  @Get('cases/:caseId/generated-documents')
  listGenerated(@Param('caseId') caseId: string) {
    return this.templates.listGenerated(caseId);
  }
}
