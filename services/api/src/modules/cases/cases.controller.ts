import { Body, Controller, Get, Headers, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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

  @Post('voice/transcripts/audio')
  @UseInterceptors(FileInterceptor('audio', { limits: { fileSize: 25 * 1024 * 1024 } }))
  createAudioTranscript(
    @UploadedFile() file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
    @Body() body: { caseId?: string; language?: 'ru' | 'kk' | 'en'; text?: string },
  ) {
    return this.cases.createTranscriptFromAudio(body, file);
  }

  @Get('voice/transcripts/:id')
  getTranscript(@Param('id') id: string) {
    return this.cases.getTranscript(id);
  }
}
