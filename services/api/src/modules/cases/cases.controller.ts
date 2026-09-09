import { Body, Controller, Get, Headers, Param, Post, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { assertSameUser, assertUserId } from '../../common/user-context';
import { CasesService } from './cases.service';

type MultipartField = { value?: unknown };
type MultipartFile = {
  filename: string;
  mimetype: string;
  fields: Record<string, unknown>;
  toBuffer: () => Promise<Buffer>;
};
type MultipartRequest = FastifyRequest & { file: () => Promise<MultipartFile | undefined> };

@Controller()
export class CasesController {
  constructor(private readonly cases: CasesService) {}

  @Post('cases')
  createCase(
    @Body() body: { ownerUserId: string; profileId?: string; problemText: string },
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-user-id') userId?: string | string[],
  ) {
    assertSameUser(userId, body.ownerUserId);
    return this.cases.createCase(body, idempotencyKey);
  }

  @Get('cases')
  listCases(@Headers('x-user-id') userId?: string | string[]) {
    return this.cases.listCases(assertUserId(userId));
  }

  @Get('cases/:caseId')
  getCase(@Param('caseId') caseId: string, @Headers('x-user-id') userId?: string | string[]) {
    return this.cases.getCase(caseId, assertUserId(userId));
  }

  @Post('cases/:caseId/messages')
  addMessage(@Param('caseId') caseId: string, @Body() body: { role: 'user' | 'assistant'; text: string }, @Headers('x-user-id') userId?: string | string[]) {
    return this.cases.addMessage(caseId, body, assertUserId(userId));
  }

  @Get('cases/:caseId/messages')
  listMessages(@Param('caseId') caseId: string, @Headers('x-user-id') userId?: string | string[]) {
    return this.cases.listMessages(caseId, assertUserId(userId));
  }

  @Post('voice/transcripts')
  createTranscript(@Body() body: { caseId?: string; language?: 'ru' | 'kk' | 'en'; audioRef?: string; text?: string }, @Headers('x-user-id') userId?: string | string[]) {
    return this.cases.createTranscript(body, assertUserId(userId));
  }

  @Post('voice/transcripts/audio')
  async createAudioTranscript(
    @Req() request: MultipartRequest,
    @Headers('x-user-id') userId?: string | string[],
  ) {
    const part = await request.file();
    const buffer = await part?.toBuffer();
    const body = {
      caseId: stringField(part?.fields.caseId as MultipartField | undefined),
      language: languageField(part?.fields.language as MultipartField | undefined),
      text: stringField(part?.fields.text as MultipartField | undefined),
    };
    const file = buffer && part ? { originalname: part.filename, mimetype: part.mimetype, size: buffer.length, buffer } : undefined;
    return this.cases.createTranscriptFromAudio(body, file, assertUserId(userId));
  }

  @Get('voice/transcripts/:id')
  getTranscript(@Param('id') id: string, @Headers('x-user-id') userId?: string | string[]) {
    return this.cases.getTranscript(id, assertUserId(userId));
  }
}

function stringField(field?: MultipartField) {
  return typeof field?.value === 'string' ? field.value : undefined;
}

function languageField(field?: MultipartField): 'ru' | 'kk' | 'en' | undefined {
  const value = stringField(field);
  return value === 'ru' || value === 'kk' || value === 'en' ? value : undefined;
}
