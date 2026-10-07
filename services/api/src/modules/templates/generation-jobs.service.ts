import { isDeepStrictEqual } from 'node:util';
import { BadRequestException, Injectable, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../../common/database/database.service';
import { TemplatesService } from './templates.service';
import { GeneratedDocument } from './templates.types';

export interface GenerationInput { templateId: string; caseId: string; fields: Record<string, string>; confirmedCitationIds?: string[] }
export interface GenerationJob { id: string; ownerUserId: string; caseId: string; status: 'queued' | 'running' | 'completed' | 'cancelled' | 'failed'; stage: string; input: GenerationInput; document?: GeneratedDocument; error?: string; createdAt: string; updatedAt: string; lease?: string }
@Injectable()
export class GenerationJobsService implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;
  private busy = false;
  private readonly jobs = new Map<string, GenerationJob>();
  private get persistent() { return Boolean(process.env.DATABASE_URL); }
  constructor(private readonly templates: TemplatesService, private readonly db: DatabaseService) {}
  onModuleInit() { this.timer = setInterval(() => { void this.processNext().catch(() => undefined); }, 250); this.timer.unref(); }
  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }
  async enqueue(input: GenerationInput, ownerUserId: string, key: string) {
    if (!key || key.length > 160) throw new BadRequestException('IDEMPOTENCY_KEY_REQUIRED');
    await this.templates.buildDocument(input, ownerUserId); // Validate before accepting any job.
    const now = new Date().toISOString();
    const job: GenerationJob = { id: randomUUID(), ownerUserId, caseId: input.caseId, status: 'queued', stage: 'queued', input, createdAt: now, updatedAt: now };
    if (this.persistent) {
      const result = await this.db.query<{payload: GenerationJob}>(`INSERT INTO document_generation_jobs (id, owner_user_id, case_id, idempotency_key, payload) VALUES ($1,$2,$3,$4,$5::jsonb) ON CONFLICT(owner_user_id,idempotency_key) DO UPDATE SET payload=CASE WHEN document_generation_jobs.payload->>'status' IN ('cancelled','failed') AND document_generation_jobs.payload->'input'=EXCLUDED.payload->'input' THEN document_generation_jobs.payload || jsonb_build_object('status','queued','stage','queued','lease',null,'updatedAt',now()) ELSE document_generation_jobs.payload END, updated_at=now() RETURNING payload`, [job.id, ownerUserId, input.caseId, key, JSON.stringify(job)]);
      const saved = result.rows[0].payload;
      if (!isDeepStrictEqual(saved.input,input)) throw new BadRequestException('IDEMPOTENCY_INPUT_MISMATCH');
      return saved;
    }
    const existing = [...this.jobs.values()].find(item => item.ownerUserId === ownerUserId && (item as GenerationJob & {key?: string}).key === key);
    if (existing) { if (!isDeepStrictEqual(existing.input,input)) throw new BadRequestException('IDEMPOTENCY_INPUT_MISMATCH'); if (['cancelled','failed'].includes(existing.status)) { const retried={...job,id:existing.id}; this.jobs.set(existing.id,Object.assign(retried,{key})); return retried; } return existing; }
    this.jobs.set(job.id, Object.assign(job, {key})); return job;
  }
  async get(id: string, ownerUserId: string) {
    const job = this.persistent ? (await this.db.query<{payload: GenerationJob}>('SELECT payload FROM document_generation_jobs WHERE id=$1 AND owner_user_id=$2', [id, ownerUserId])).rows[0]?.payload : this.jobs.get(id);
    if (!job || job.ownerUserId !== ownerUserId) throw new NotFoundException('GENERATION_JOB_NOT_FOUND');
    if(job.status==='completed' && job.document) return {...job,document:await this.templates.getGenerated(job.document.id,ownerUserId)};
    return job;
  }
  async list(caseId: string, ownerUserId: string) {
    await this.templates.listGenerated(caseId, ownerUserId);
    if (this.persistent) return (await this.db.query<{payload: GenerationJob}>('SELECT payload FROM document_generation_jobs WHERE case_id=$1 AND owner_user_id=$2 ORDER BY created_at DESC LIMIT 50', [caseId,ownerUserId])).rows.map(row => row.payload);
    return [...this.jobs.values()].filter(job => job.caseId === caseId && job.ownerUserId === ownerUserId).reverse();
  }
  async cancel(id: string, ownerUserId: string) {
    const job = await this.get(id, ownerUserId);
    if (!['queued','running'].includes(job.status)) return job;
    if (this.persistent) await this.db.query(`UPDATE document_generation_jobs SET payload=payload || jsonb_build_object('status','cancelled','stage','cancelled','updatedAt',now()), updated_at=now() WHERE id=$1 AND owner_user_id=$2 AND payload->>'status' IN ('queued','running')`, [id,ownerUserId]);
    else Object.assign(job, {status: 'cancelled', stage: 'cancelled', updatedAt: new Date().toISOString()});
    return this.get(id,ownerUserId);
  }
  async processNext() {
    if (this.busy) return;
    this.busy = true;
    let job: GenerationJob | undefined;
    const lease = randomUUID();
    try {
      if (this.persistent) {
        const rows = await this.db.query<{payload: GenerationJob}>(`WITH candidate AS (SELECT id FROM document_generation_jobs WHERE payload->>'status'='queued' OR (payload->>'status'='running' AND updated_at < now()-interval '60 seconds') ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1) UPDATE document_generation_jobs j SET payload=payload || jsonb_build_object('status','running','stage','rendering','lease',$1::text,'updatedAt',now()), updated_at=now() FROM candidate c WHERE j.id=c.id RETURNING j.payload`,[lease]);
        job = rows.rows[0]?.payload;
      } else {
        job = [...this.jobs.values()].find(item => item.status === 'queued');
        if (job) Object.assign(job, {status:'running',stage:'rendering'});
      }
      if (!job) return;
      const document = await this.templates.buildDocument(job.input, job.ownerUserId);
      document.id = job.id; // Stable result ID across restarts/retries.
      if (this.persistent) {
        await this.db.query(`WITH active AS (SELECT id FROM document_generation_jobs WHERE id=$1 AND payload->>'status'='running' AND payload->>'lease'=$9 FOR UPDATE), saved AS (INSERT INTO generated_documents (id,template_id,case_id,status,title,body,expert_review_required) SELECT $1,$2,$3,$4,$5,$6,$7 FROM active ON CONFLICT(id) DO UPDATE SET id=EXCLUDED.id RETURNING id) UPDATE document_generation_jobs SET payload=payload || jsonb_build_object('status','completed','stage','completed','document',$8::jsonb,'updatedAt',now()), updated_at=now() WHERE id IN (SELECT id FROM saved)`, [job.id,document.templateId,document.caseId,document.status,document.title,document.body,document.expertReviewRequired,JSON.stringify(document),lease]);
      } else if (job.status !== 'cancelled') {
        this.templates.storeLocalDocument(document);
        Object.assign(job,{status:'completed',stage:'completed',document,updatedAt:new Date().toISOString()});
      }
    } catch {
      if (job) {
        if (this.persistent) await this.db.query(`UPDATE document_generation_jobs SET payload=payload || jsonb_build_object('status','failed','stage','failed','error','DOCUMENT_GENERATION_FAILED','updatedAt',now()), updated_at=now() WHERE id=$1 AND payload->>'status'='running' AND payload->>'lease'=$2`,[job.id,lease]);
        else if (job.status !== 'cancelled') Object.assign(job,{status:'failed',stage:'failed',error:'DOCUMENT_GENERATION_FAILED'});
      }
    } finally { this.busy = false; }
  }
}
