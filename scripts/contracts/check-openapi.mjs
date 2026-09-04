import { readFileSync } from 'node:fs';

let yaml;
try {
  yaml = await import('yaml');
} catch {
  yaml = await import('js-yaml');
}

const text = readFileSync('packages/contracts/openapi.yaml', 'utf8');
const parse = yaml.parse ?? yaml.load;
const data = parse(text);
const requiredPaths = [
  '/health',
  '/auth/register',
  '/cases',
  '/files/upload-sessions',
  '/legal-sources/manual-import',
  '/templates',
  '/subscriptions/current',
];

for (const path of requiredPaths) {
  if (!data.paths?.[path]) throw new Error(`Missing OpenAPI path: ${path}`);
}

console.log('openapi contract ok');
