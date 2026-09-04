import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { buildGeneratedClients } from './generated-client-content.mjs';

let yaml;
try {
  yaml = await import('yaml');
} catch {
  yaml = await import('js-yaml');
}

const parse = yaml.parse ?? yaml.load;
const spec = parse(readFileSync('packages/contracts/openapi.yaml', 'utf8'));
const { paths, ts, dart } = buildGeneratedClients(spec);

mkdirSync('packages/contracts/generated', { recursive: true });
mkdirSync('apps/admin/src/api', { recursive: true });
mkdirSync('apps/mobile/lib/src/api', { recursive: true });

writeFileSync('packages/contracts/generated/api-paths.ts', ts);
writeFileSync('apps/admin/src/api/api-paths.ts', ts);
writeFileSync('apps/mobile/lib/src/api/api_contract.dart', dart);

console.log(`generated ${paths.length} api paths`);
