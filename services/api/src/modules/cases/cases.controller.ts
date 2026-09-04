import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { CasesService } from './cases.service';

@Controller()
export class CasesController {
  constructor(private readonly cases: CasesService) {}

  @Post('cases')
  createCase(
    @Body() body: { ownerUserId: string; profileId?: string; problemText: string },
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.cases.createCase(body, idempotencyKey);
  }

  @Get('cases')
  listCases(@Headers('x-user-id') userId = '') {
    return this.cases.listCases(userId);
  }

  @Get('cases/:caseId')
  getCase(@Param('caseId') caseId: string) {
    return this.cases.getCase(caseId);
  }

  @Post('cases/:caseId/messages')
  addMessage(@Param('caseId') caseId: string, @Body() body: { role: 'user' | 'assistant'; text: string }) {
    return this.cases.addMessage(caseId, body);
  }

  @Get('cases/:caseId/messages')
  listMessages(@Param('caseId') caseId: string) {
    return this.cases.listMessages(caseId);
  }

  @Post('voice/transcripts')
  createTranscript(@Body() body: { caseId?: string; language?: 'ru' | 'kk' | 'en'; audioRef?: string; text?: string }) {
    return this.cases.createTranscript(body);
  }

  @Get('voice/transcripts/:id')
  getTranscript(@Param('id') id: string) {
    return this.cases.getTranscript(id);
  }
}
