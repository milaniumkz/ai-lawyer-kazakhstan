import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as request from 'supertest';
import { SafeHttpExceptionFilter } from '../common/safe-http-exception.filter';
import { AppModule } from './app.module';

describe('AppModule HTTP smoke', () => {
  let app: INestApplication;
  let voiceUploadDir: string;

  beforeAll(async () => {
    voiceUploadDir = await mkdtemp(join(tmpdir(), 'app-smoke-voice-'));
    process.env.VOICE_UPLOAD_DIR = voiceUploadDir;
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new SafeHttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    delete process.env.VOICE_UPLOAD_DIR;
    await rm(voiceUploadDir, { recursive: true, force: true });
  });

  it('serves health through the public API prefix', async () => {
    await request(app.getHttpServer()).get('/api/v1/health').expect(200).expect(({ body }) => {
      expect(body).toMatchObject({ status: 'ok', jurisdiction: 'KZ' });
    });
  });

  it('covers identity, cases, documents, RAG, templates and billing routes', async () => {
    const auth = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ channel: 'phone', phone: '+77011234567', consentVersion: 'v1' })
      .expect(201);

    const tokens = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/verify')
      .send({ otpId: auth.body.otpId, code: '111111' })
      .expect(201);

    const userId = tokens.body.user.id as string;
    await request(app.getHttpServer())
      .post('/api/v1/profiles')
      .set('x-user-id', userId)
      .send({ userId, type: 'person', displayName: 'Smoke User' })
      .expect(201);
    await request(app.getHttpServer()).get('/api/v1/sessions').set('x-user-id', userId).expect(200);
    await request(app.getHttpServer()).get('/api/v1/profiles').set('x-user-id', userId).expect(200);
    await request(app.getHttpServer()).get('/api/v1/subscriptions/current').set('x-user-id', userId).expect(200);

    const legalCase = await request(app.getHttpServer())
      .post('/api/v1/cases')
      .set('idempotency-key', 'smoke-case-1')
      .set('x-user-id', userId)
      .send({ ownerUserId: userId, problemText: 'Нужно взыскать долг по договору займа' })
      .expect(201);

    await request(app.getHttpServer()).get('/api/v1/cases').set('x-user-id', userId).expect(200);
    await request(app.getHttpServer())
      .post(`/api/v1/cases/${legalCase.body.id}/messages`)
      .set('x-user-id', userId)
      .send({ role: 'user', text: 'Что делать дальше?' })
      .expect(201);

    const upload = await request(app.getHttpServer())
      .post('/api/v1/files/upload-sessions')
      .set('x-user-id', userId)
      .send({ caseId: legalCase.body.id, fileName: 'claim.pdf', mimeType: 'application/pdf', sizeBytes: 1024 })
      .expect(201);
    const document = await request(app.getHttpServer())
      .post('/api/v1/files/complete')
      .set('x-user-id', userId)
      .send({ uploadSessionId: upload.body.id, sha256: 'smoke-hash-1' })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/documents/${document.body.id}/ocr-confirm`)
      .set('x-user-id', userId)
      .send({ fields: { amount: '150000' } })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/voice/transcripts/audio')
      .attach('audio', Buffer.from('smoke-audio'), { filename: 'voice.webm', contentType: 'audio/webm' })
      .expect(403);
    const transcript = await request(app.getHttpServer())
      .post('/api/v1/voice/transcripts/audio')
      .set('x-user-id', userId)
      .field('caseId', legalCase.body.id)
      .field('language', 'ru')
      .field('text', 'Голосовое описание взыскания долга')
      .attach('audio', Buffer.from('smoke-audio'), { filename: 'voice.webm', contentType: 'audio/webm' })
      .expect(201);
    await request(app.getHttpServer()).get(`/api/v1/voice/transcripts/${transcript.body.id}`).set('x-user-id', 'other-user').expect(403);
    await request(app.getHttpServer()).get(`/api/v1/voice/transcripts/${transcript.body.id}`).set('x-user-id', userId).expect(200);

    const source = await request(app.getHttpServer())
      .post('/api/v1/legal-sources/manual-import')
      .set('x-user-role', 'admin')
      .send({
        officialId: 'adilet:smoke:001',
        title: 'Официальный фрагмент РК',
        sourceType: 'law',
        authority: 'Әділет',
        language: 'ru',
        article: '1',
        text: 'Официальный тестовый фрагмент о взыскании долга.',
        sourceUrl: 'https://adilet.zan.kz/rus/docs/smoke',
        effectiveFrom: '2024-01-01T00:00:00.000Z',
        sourceVersion: '2024-01-01',
        status: 'active',
      })
      .expect(201);
    await request(app.getHttpServer()).post('/api/v1/citations/validate').send({ fragmentId: source.body.id, article: '1' }).expect(201);

    const templates = await request(app.getHttpServer()).get('/api/v1/templates').expect(200);
    await request(app.getHttpServer())
      .post('/api/v1/documents/generate')
      .set('x-user-id', userId)
      .send({
        templateId: templates.body[0].id,
        caseId: legalCase.body.id,
        fields: {
          claimantName: 'Иван Иванов',
          respondentName: 'ТОО Борышкер',
          claimAmount: '150000',
          claimReason: 'задолженность по договору',
          deadlineDate: '2026-09-20',
        },
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/usage/ai')
      .set('x-user-role', 'admin')
      .send({
        userId,
        provider: 'stub',
        modelAlias: 'simple',
        inputUnits: 1,
        outputUnits: 1,
        durationMs: 1,
        estimatedCostKzt: 0,
        complexity: 'simple',
        risk: 'low',
        correlationId: 'smoke',
      })
      .expect(201);
  });

  it('enforces case ownership on generated documents', async () => {
    const auth = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ channel: 'phone', phone: '+77011234563', consentVersion: 'v1' })
      .expect(201);
    const tokens = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/verify')
      .send({ otpId: auth.body.otpId, code: '111111' })
      .expect(201);
    const userId = tokens.body.user.id as string;
    const legalCase = await request(app.getHttpServer())
      .post('/api/v1/cases')
      .set('x-user-id', userId)
      .send({ ownerUserId: userId, problemText: 'Нужно взыскать долг по расписке' })
      .expect(201);
    const templates = await request(app.getHttpServer()).get('/api/v1/templates').expect(200);
    const payload = {
      templateId: templates.body[0].id,
      caseId: legalCase.body.id,
      fields: {
        claimantName: 'Иван Иванов',
        respondentName: 'ТОО Борышкер',
        claimAmount: '150000',
        claimReason: 'задолженность по договору',
        deadlineDate: '2026-09-20',
      },
    };

    await request(app.getHttpServer()).post('/api/v1/documents/generate').send(payload).expect(403);
    await request(app.getHttpServer()).post('/api/v1/documents/generate').set('x-user-id', 'other-user').send(payload).expect(403);
    await request(app.getHttpServer()).get(`/api/v1/cases/${legalCase.body.id}/generated-documents`).set('x-user-id', userId).expect(200);
  });

  it('enforces case ownership on case and chat endpoints', async () => {
    const auth = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ channel: 'phone', phone: '+77011234565', consentVersion: 'v1' })
      .expect(201);
    const tokens = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/verify')
      .send({ otpId: auth.body.otpId, code: '111111' })
      .expect(201);
    const userId = tokens.body.user.id as string;
    await request(app.getHttpServer())
      .post('/api/v1/cases')
      .send({ ownerUserId: userId, problemText: 'Нужно взыскать долг по расписке' })
      .expect(403);
    await request(app.getHttpServer())
      .post('/api/v1/cases')
      .set('x-user-id', 'other-user')
      .send({ ownerUserId: userId, problemText: 'Нужно взыскать долг по расписке' })
      .expect(403);
    const legalCase = await request(app.getHttpServer())
      .post('/api/v1/cases')
      .set('x-user-id', userId)
      .send({ ownerUserId: userId, problemText: 'Нужно взыскать долг по расписке' })
      .expect(201);

    await request(app.getHttpServer()).get(`/api/v1/cases/${legalCase.body.id}`).expect(403);
    await request(app.getHttpServer()).get(`/api/v1/cases/${legalCase.body.id}`).set('x-user-id', 'other-user').expect(403);
    await request(app.getHttpServer()).get(`/api/v1/cases/${legalCase.body.id}`).set('x-user-id', userId).expect(200);
    await request(app.getHttpServer())
      .post(`/api/v1/cases/${legalCase.body.id}/messages`)
      .send({ role: 'user', text: 'Чужой запрос' })
      .expect(403);
  });

  it('enforces case ownership on document endpoints', async () => {
    const auth = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ channel: 'phone', phone: '+77011234564', consentVersion: 'v1' })
      .expect(201);
    const tokens = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/verify')
      .send({ otpId: auth.body.otpId, code: '111111' })
      .expect(201);
    const userId = tokens.body.user.id as string;
    const legalCase = await request(app.getHttpServer())
      .post('/api/v1/cases')
      .set('x-user-id', userId)
      .send({ ownerUserId: userId, problemText: 'Нужно взыскать долг по расписке' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/files/upload-sessions')
      .send({ caseId: legalCase.body.id, fileName: 'claim.pdf', mimeType: 'application/pdf', sizeBytes: 1024 })
      .expect(403);
    await request(app.getHttpServer())
      .post('/api/v1/files/upload-sessions')
      .set('x-user-id', 'other-user')
      .send({ caseId: legalCase.body.id, fileName: 'claim.pdf', mimeType: 'application/pdf', sizeBytes: 1024 })
      .expect(403);
    await request(app.getHttpServer()).get(`/api/v1/cases/${legalCase.body.id}/documents`).set('x-user-id', userId).expect(200);
  });

  it('enforces admin role on admin operations', async () => {
    await request(app.getHttpServer()).get('/api/v1/admin/audit-events').expect(403);
    await request(app.getHttpServer()).get('/api/v1/admin/providers').expect(403);
    await request(app.getHttpServer()).post('/api/v1/legal-sources/manual-import').send({}).expect(403);
    await request(app.getHttpServer()).post('/api/v1/usage/ai').send({}).expect(403);

    await request(app.getHttpServer()).get('/api/v1/admin/audit-events').set('x-user-role', 'admin').expect(200);
    await request(app.getHttpServer())
      .post('/api/v1/admin/providers')
      .set('x-user-role', 'admin')
      .send({ provider: 'stub', enabled: true })
      .expect(201);
  });

  it('enforces current user header on identity and billing reads', async () => {
    const auth = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ channel: 'email', email: 'scoped@example.kz', consentVersion: 'v1' })
      .expect(201);
    const tokens = await request(app.getHttpServer()).post('/api/v1/auth/otp/verify').send({ otpId: auth.body.otpId, code: '111111' }).expect(201);
    const userId = tokens.body.user.id as string;

    await request(app.getHttpServer()).get('/api/v1/sessions').expect(403);
    await request(app.getHttpServer()).get('/api/v1/profiles').expect(403);
    await request(app.getHttpServer()).get('/api/v1/subscriptions/current').expect(403);
    await request(app.getHttpServer()).post('/api/v1/auth/logout-all').send({ userId }).expect(403);
    await request(app.getHttpServer()).post('/api/v1/profiles').set('x-user-id', 'other-user').send({ userId, type: 'person', displayName: 'Mismatch' }).expect(403);

    await request(app.getHttpServer()).post('/api/v1/profiles').set('x-user-id', userId).send({ userId, type: 'person', displayName: 'Scoped User' }).expect(201);
  });
});
