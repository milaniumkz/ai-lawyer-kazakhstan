import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const files = execFileSync('git', ['ls-files', 'apps', 'services', 'packages', '.github', '.env.example'], {
  encoding: 'utf8',
})
  .split('\n')
  .filter(Boolean);

const secretPatterns = [
  /AKIA[0-9A-Z]{16}/,
  /-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----/,
  /(?:password|secret|token|api_key)\s*[:=]\s*['"][^'"]{12,}/i,
];

const forbiddenForeignLaw = [/\bГК РФ\b/i, /\bГПК РФ\b/i, /\bУК РФ\b/i, /\bТК РФ\b/i, /\bИНН\b/i, /\bОГРН\b/i, /\bрубл/i];

const failures = [];
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  for (const pattern of secretPatterns) {
    if (pattern.test(text)) failures.push(`${file}: possible secret ${pattern}`);
  }
  for (const pattern of forbiddenForeignLaw) {
    if (pattern.test(text)) failures.push(`${file}: forbidden foreign-law token ${pattern}`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('security scan ok');
