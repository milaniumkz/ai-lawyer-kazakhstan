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
  const value = process.env[key] ?? '';
  if (placeholderValues.has(value)) failures.push(`${key} is missing or placeholder`);
}

for (const key of ['API_PUBLIC_URL', 'ADMIN_PUBLIC_URL']) {
  const value = process.env[key] ?? '';
  if (value && !value.startsWith('https://')) failures.push(`${key} must use https://`);
}

if (process.env.PERSISTENCE_MODE !== 'postgres') failures.push('PERSISTENCE_MODE must be postgres');
if ((process.env.MESSAGING_INTEGRATION_MODE ?? 'stub') === 'stub') failures.push('MESSAGING_INTEGRATION_MODE must not be stub');
if ((process.env.PAYMENT_INTEGRATION_MODE ?? 'stub') === 'stub') failures.push('PAYMENT_INTEGRATION_MODE must not be stub');
if ((process.env.LEGAL_SOURCE_MODE ?? 'stub') === 'stub') failures.push('LEGAL_SOURCE_MODE must not be stub');

for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'FIELD_ENCRYPTION_KEY', 'SIGNED_URL_SECRET']) {
  const value = process.env[key] ?? '';
  if (value && value.length < 32) failures.push(`${key} must be at least 32 chars`);
}

if (failures.length) {
  console.error(`production env blocked:\n${failures.join('\n')}`);
  process.exit(1);
}

console.log('production env ok');
