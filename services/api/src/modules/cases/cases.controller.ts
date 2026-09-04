import { Body, Controller, Get, Headers, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { assertUserId } from '../../common/user-context';
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
  getCase(@Param('caseId') caseId: string, @Headers('x-user-id') userId = '') {
    return this.cases.getCase(caseId, userId);
  }

  @Post('cases/:caseId/messages')
  addMessage(@Param('caseId') caseId: string, @Body() body: { role: 'user' | 'assistant'; text: string }, @Headers('x-user-id') userId = '') {
    return this.cases.addMessage(caseId, body, userId);
  }

  @Get('cases/:caseId/messages')
  listMessages(@Param('caseId') caseId: string, @Headers('x-user-id') userId = '') {
    return this.cases.listMessages(caseId, userId);
  }

  @Post('voice/transcripts')
  createTranscript(@Body() body: { caseId?: string; language?: 'ru' | 'kk' | 'en'; audioRef?: string; text?: string }, @Headers('x-user-id') userId?: string | string[]) {
    return this.cases.createTranscript(body, assertUserId(userId));
  }

  @Post('voice/transcripts/audio')
  @UseInterceptors(FileInterceptor('audio', { limits: { fileSize: 25 * 1024 * 1024 } }))
  createAudioTranscript(
    @UploadedFile() file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
    @Body() body: { caseId?: string; language?: 'ru' | 'kk' | 'en'; text?: string },
    @Headers('x-user-id') userId?: string | string[],
  ) {
    return this.cases.createTranscriptFromAudio(body, file, assertUserId(userId));
  }

  @Get('voice/transcripts/:id')
  getTranscript(@Param('id') id: string, @Headers('x-user-id') userId?: string | string[]) {
    return this.cases.getTranscript(id, assertUserId(userId));
  }
}
