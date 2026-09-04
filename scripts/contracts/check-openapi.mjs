import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
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
const requiredPaths = extractControllerPaths('services/api/src/modules');

for (const path of requiredPaths) {
  if (!data.paths?.[path]) throw new Error(`Missing OpenAPI path: ${path}`);
}

const controllerPathSet = new Set(requiredPaths);
for (const path of Object.keys(data.paths ?? {})) {
  if (!controllerPathSet.has(path)) throw new Error(`OpenAPI path has no controller route: ${path}`);
}

const generated = buildGeneratedClients(data);
assertFileEquals('packages/contracts/generated/api-paths.ts', generated.ts);
assertFileEquals('apps/admin/src/api/api-paths.ts', generated.ts);
assertDartContainsPaths('apps/mobile/lib/src/api/api_contract.dart', generated.paths);

console.log('openapi contract ok');

function extractControllerPaths(root) {
  const files = walk(root).filter((file) => file.endsWith('.controller.ts'));
  return files.flatMap((file) => {
    const source = readFileSync(file, 'utf8');
    const controllerPrefix = matchDecoratorArg(source, 'Controller') ?? '';
    const routePattern = /@(Get|Post|Put|Delete|Patch)\(([^)]*)\)/g;
    const paths = [];
    for (const match of source.matchAll(routePattern)) {
      const methodPath = parseDecoratorPath(match[2]);
      paths.push(toOpenApiPath(controllerPrefix, methodPath));
    }
    return paths;
  }).sort();
}

function walk(path) {
  return readdirSync(path).flatMap((entry) => {
    const fullPath = join(path, entry);
    return statSync(fullPath).isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function matchDecoratorArg(source, decorator) {
  const match = source.match(new RegExp(`@${decorator}\\(([^)]*)\\)`));
  return match ? parseDecoratorPath(match[1]) : undefined;
}

function parseDecoratorPath(argument) {
  const trimmed = argument.trim();
  if (!trimmed) return '';
  const match = trimmed.match(/^['"`]([^'"`]*)['"`]$/);
  return match?.[1] ?? '';
}

function toOpenApiPath(prefix, route) {
  const joined = `/${[prefix, route].filter(Boolean).join('/')}`;
  return joined.replace(/\/+/g, '/').replace(/:([A-Za-z0-9_]+)/g, '{$1}');
}

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
