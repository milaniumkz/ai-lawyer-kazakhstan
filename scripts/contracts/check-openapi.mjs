import { readFileSync } from 'node:fs';
import { buildGeneratedClients } from './generated-client-content.mjs';

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

const generated = buildGeneratedClients(data);
assertFileEquals('packages/contracts/generated/api-paths.ts', generated.ts);
assertFileEquals('apps/admin/src/api/api-paths.ts', generated.ts);
assertDartContainsPaths('apps/mobile/lib/src/api/api_contract.dart', generated.paths);

console.log('openapi contract ok');

function assertFileEquals(path, expected) {
  const actual = readFileSync(path, 'utf8');
  if (actual !== expected) throw new Error(`Generated file is not up to date: ${path}`);
}

function assertDartContainsPaths(path, expectedPaths) {
  const actual = readFileSync(path, 'utf8');
  for (const apiPath of expectedPaths) {
    if (!actual.includes(`'${apiPath}'`)) throw new Error(`Generated Dart contract is missing path ${apiPath}`);
  }
}
