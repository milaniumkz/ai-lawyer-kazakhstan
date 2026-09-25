import fs from 'node:fs';
import path from 'node:path';

const args = new Set(process.argv.slice(2));
const envFileArg = process.argv.find((arg) => arg.startsWith('--env-file='));
const json = args.has('--json');

function parseEnvFile(filePath) {
  const resolved = path.resolve(filePath);
  const body = fs.readFileSync(resolved, 'utf8');
  const parsed = {};

  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const match = line.match(/^(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)$/i);
    if (!match) continue;

    const [, key, rawValue] = match;
    let value = rawValue.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    parsed[key] = value;
  }

  return parsed;
}

const fileEnv = envFileArg ? parseEnvFile(envFileArg.split('=')[1]) : {};
const runtimeEnv = { ...process.env, ...fileEnv };

const required = [
  'API_PUBLIC_URL',
  'ADMIN_PUBLIC_URL',
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'FIELD_ENCRYPTION_KEY',
  'SIGNED_URL_SECRET',
  'AI_PROVIDER',
  'AI_API_KEY',
  'STT_PROVIDER',
  'STT_API_KEY',
  'S3_ENDPOINT',
  'S3_BUCKET',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
];

const placeholderValues = new Set(['', 'stub', 'local', 'change-me-in-runtime-secret-manager']);
const failures = [];

for (const key of required) {
  const value = runtimeEnv[key] ?? '';
  if (placeholderValues.has(value)) failures.push(`${key} is missing or placeholder`);
}

for (const key of ['API_PUBLIC_URL', 'ADMIN_PUBLIC_URL']) {
  const value = runtimeEnv[key] ?? '';
  if (value && !value.startsWith('https://')) failures.push(`${key} must use https://`);
}

if (runtimeEnv.PERSISTENCE_MODE !== 'postgres') failures.push('PERSISTENCE_MODE must be postgres');
if ((runtimeEnv.MESSAGING_INTEGRATION_MODE ?? 'stub') === 'stub') failures.push('MESSAGING_INTEGRATION_MODE must not be stub');
if ((runtimeEnv.PAYMENT_INTEGRATION_MODE ?? 'stub') === 'stub') failures.push('PAYMENT_INTEGRATION_MODE must not be stub');
if ((runtimeEnv.LEGAL_SOURCE_MODE ?? 'stub') === 'stub') failures.push('LEGAL_SOURCE_MODE must not be stub');

for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'FIELD_ENCRYPTION_KEY', 'SIGNED_URL_SECRET']) {
  const value = runtimeEnv[key] ?? '';
  if (value && value.length < 32) failures.push(`${key} must be at least 32 chars`);
}

if (json) {
  console.log(JSON.stringify({
    ok: failures.length === 0,
    source: envFileArg ? path.resolve(envFileArg.split('=')[1]) : 'process.env',
    checked: required.length + 7,
    failures,
  }, null, 2));
}

if (failures.length) {
  if (!json) console.error(`production env blocked:\n${failures.join('\n')}`);
  process.exit(1);
}

if (!json) console.log('production env ok');
