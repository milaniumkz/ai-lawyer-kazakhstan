import { readdirSync, readFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

let yaml;
try {
  yaml = await import('yaml');
} catch {
  yaml = await import('js-yaml');
}

function collectFiles(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.next', 'dist', 'build', '.git'].includes(entry.name)) continue;
      found.push(...collectFiles(path));
    } else if (entry.isFile() && /\.(ts|tsx|js|mjs|json|ya?ml|md|env|example)$/.test(entry.name)) {
      found.push(path);
    }
  }
  return found;
}

function scanFiles() {
  try {
    return execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', 'apps', 'services', 'packages', '.github', '.env.example'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .split('\n')
      .filter(Boolean)
      .filter((path) => {
        try {
          statSync(path);
          return true;
        } catch {
          return false;
        }
      });
  } catch {
    return ['apps', 'services', 'packages', '.github', '.env.example']
      .filter((path) => {
        try {
          statSync(path);
          return true;
        } catch {
          return false;
        }
      })
      .flatMap((path) => (statSync(path).isDirectory() ? collectFiles(path) : [path]));
  }
}

const files = scanFiles();

const secretPatterns = [
  /AKIA[0-9A-Z]{16}/,
  /-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----/,
  /(?:password|secret|token|api_key)\s*[:=]\s*['"][^'"]{12,}/i,
];

const forbiddenForeignLaw = [/\bГК РФ\b/i, /\bГПК РФ\b/i, /\bУК РФ\b/i, /\bТК РФ\b/i, /\bИНН\b/i, /\bОГРН\b/i, /\bрубл/i];
const forbiddenWorkMarkers = [/\bTODO\b/i, /\bFIXME\b/i, /\bHACK\b/i];

const failures = [];
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  for (const pattern of secretPatterns) {
    if (pattern.test(text)) failures.push(`${file}: possible secret ${pattern}`);
  }
  for (const pattern of forbiddenForeignLaw) {
    if (pattern.test(text)) failures.push(`${file}: forbidden foreign-law token ${pattern}`);
  }
  for (const pattern of forbiddenWorkMarkers) {
    if (pattern.test(text)) failures.push(`${file}: unresolved work marker ${pattern}`);
  }
}

const openapiText = readFileSync('packages/contracts/openapi.yaml', 'utf8');
const parse = yaml.parse ?? yaml.load;
const openapi = parse(openapiText);
const publicOperations = new Set([
  'GET /health',
  'POST /auth/register',
  'POST /auth/otp/verify',
  'POST /auth/login',
  'POST /auth/refresh',
  'GET /legal-search',
  'POST /citations/validate',
  'POST /rag/answer',
  'GET /templates',
]);
const adminOperations = new Set([
  'GET /admin/audit-events',
  'POST /legal-sources/manual-import',
  'POST /usage/ai',
  'GET /admin/providers',
  'POST /admin/providers',
  'GET /admin/documents/review-queue',
  'POST /admin/documents/{documentId}/ocr-confirm',
  'POST /admin/documents/{documentId}/reject',
  'GET /admin/legal-categories',
  'GET /admin/legal-categories/change-requests',
  'POST /admin/legal-categories/change-requests',
  'GET /admin/legal-categories/change-requests/{id}',
  'POST /admin/legal-categories/change-requests/{id}/approve',
  'POST /admin/legal-categories/change-requests/{id}/reject',
  'GET /admin/classifications/review-queue',
  'POST /admin/classifications/{id}/confirm',
  'POST /admin/classifications/{id}/override',
]);

for (const [path, pathItem] of Object.entries(openapi.paths ?? {})) {
  for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
    const operation = pathItem?.[method];
    if (!operation) continue;
    const key = `${method.toUpperCase()} ${path}`;
    if (publicOperations.has(key)) continue;
    const headers = [...(pathItem.parameters ?? []), ...(operation.parameters ?? [])].filter((parameter) => parameter.in === 'header');
    const headerNames = new Set(headers.map((parameter) => parameter.name));
    if (adminOperations.has(key)) {
      if (!headerNames.has('x-user-role')) failures.push(`OpenAPI ${key} missing x-user-role`);
    } else if (!headerNames.has('x-user-id')) {
      failures.push(`OpenAPI ${key} missing x-user-id`);
    }
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('security scan ok');
