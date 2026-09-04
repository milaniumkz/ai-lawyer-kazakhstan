import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { LegalService } from './legal.service';
import { LegalSourceFragment } from './legal.types';

@Controller()
export class LegalController {
  constructor(private readonly legal: LegalService) {}

  @Post('legal-sources/manual-import')
  importFragment(@Body() body: Omit<LegalSourceFragment, 'id' | 'retrievedAt' | 'checksum' | 'embeddingVersion'>) {
    return this.legal.importFragment(body);
  }

  @Get('legal-search')
  search(@Query('q') query = '') {
    return this.legal.search(query);
  }

  @Post('citations/validate')
  validateCitation(@Body() body: { fragmentId?: string; officialId?: string; article?: string; eventDate?: string; quotedText?: string }) {
    return this.legal.validateCitation(body);
  }

  @Post('rag/answer')
  answer(@Body() body: { query: string }) {
    return this.legal.answer(body.query);
  }
}
