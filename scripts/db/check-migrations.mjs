import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const migrationsDir = 'infra/db/migrations';
const seedsDir = 'infra/db/seeds';

const migrationFiles = readdirSync(migrationsDir).filter((file) => file.endsWith('.sql')).sort();
const failures = [];

if (migrationFiles.length < 4) failures.push('expected at least 4 migration files');

migrationFiles.forEach((file, index) => {
  const expectedPrefix = String(index + 1).padStart(4, '0');
  if (!file.startsWith(`${expectedPrefix}_`)) failures.push(`${file}: expected prefix ${expectedPrefix}_`);
});

const sql = migrationFiles.map((file) => readFileSync(join(migrationsDir, file), 'utf8')).join('\n');
const seedSql = readdirSync(seedsDir)
  .filter((file) => file.endsWith('.sql'))
  .sort()
  .map((file) => readFileSync(join(seedsDir, file), 'utf8'))
  .join('\n');

const required = [
  ['uuid extension', /CREATE EXTENSION IF NOT EXISTS "uuid-ossp"/],
  ['pgvector extension', /CREATE EXTENSION IF NOT EXISTS vector/],
  ['users table', /CREATE TABLE users/],
  ['sessions refresh token hash', /refresh_token_hash text NOT NULL/],
  ['profiles IIN hash', /iin_bin_hash text/],
  ['cases table', /CREATE TABLE legal_cases/],
  ['messages table', /CREATE TABLE messages/],
  ['transcripts table', /CREATE TABLE transcript_jobs/],
  ['files extracted fields', /extracted_fields jsonb NOT NULL/],
  ['evidence folders table', /CREATE TABLE evidence_folders/],
  ['legal source pgvector', /embedding vector\(1536\)/],
  ['templates table', /CREATE TABLE templates/],
  ['generated documents table', /CREATE TABLE generated_documents/],
  ['AI usage ledger', /CREATE TABLE ai_usage_events/],
  ['audit logs table', /CREATE TABLE audit_logs/],
  ['case idempotency keys table', /CREATE TABLE case_idempotency_keys/],
  ['upload sessions table', /CREATE TABLE upload_sessions/],
  ['subscriptions table', /CREATE TABLE subscriptions/],
  ['subscription payments table', /CREATE TABLE subscription_payments/],
  ['provider configs table', /CREATE TABLE provider_configs/],
  ['legal categories table', /CREATE TABLE legal_categories/],
  ['case classifications table', /CREATE TABLE case_classifications/],
  ['classification feedback table', /CREATE TABLE classification_feedback/],
  ['classification jurisdiction KZ check', /jurisdiction text NOT NULL CHECK \(jurisdiction = 'KZ'\)/],
];

for (const [label, pattern] of required) {
  if (!pattern.test(sql)) failures.push(`missing ${label}`);
}

if (!/tpl-pretrial-claim-ru-v1/.test(seedSql)) failures.push('missing pretrial claim seed');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`database migrations ok (${migrationFiles.length} files)`);
