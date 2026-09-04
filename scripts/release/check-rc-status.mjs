import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const failures = [];

const requiredFiles = [
  'docs/project/RC_ACCEPTANCE_MATRIX.md',
  'docs/project/RELEASE_CHECKLIST.md',
  'docs/project/EXTERNAL_BLOCKERS.md',
  'docs/project/TEST_EVIDENCE.md',
  'docs/project/ARTIFACT_CHECKSUMS.md',
  'apps/mobile/build/app/outputs/flutter-apk/app-debug.apk',
  'apps/mobile/build/app/outputs/flutter-apk/app-release.apk',
  'apps/mobile/build/ios/iphoneos/Runner.app',
];

for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`missing RC file/artifact: ${file}`);
}

const matrix = readFileSync('docs/project/RC_ACCEPTANCE_MATRIX.md', 'utf8');
const checklist = readFileSync('docs/project/RELEASE_CHECKLIST.md', 'utf8');
const blockers = readFileSync('docs/project/EXTERNAL_BLOCKERS.md', 'utf8');

const requiredMatrixSignals = [
  'Статус: RC-ready for local/internal validation.',
  'Не production launch',
  'Backend vertical slices',
  'Legal guardrails',
  'Docker health',
  'Production signing',
];

for (const signal of requiredMatrixSignals) {
  if (!matrix.toLowerCase().includes(signal.toLowerCase())) failures.push(`RC matrix missing: ${signal}`);
}

const forbiddenOpenItems = checklist
  .split('\n')
  .filter(
    (line) =>
      line.startsWith('- [ ]') &&
      !line.includes('Blocked: Docker') &&
      !line.includes('Blocked: домен/DNS') &&
      !line.includes('Blocked: SMS/payment/storage/government credentials'),
  );

if (forbiddenOpenItems.length) {
  failures.push(`unexpected open release checklist items:\n${forbiddenOpenItems.join('\n')}`);
}

const requiredBlockers = ['Нет production secrets/API keys', 'Нет официальных разрешений', 'Нет production Android keystore', 'Нет Apple distribution'];
for (const blocker of requiredBlockers) {
  if (!blockers.includes(blocker)) failures.push(`external blocker missing: ${blocker}`);
}

const docker = spawnSync('docker', ['--version'], { encoding: 'utf8' });
if (docker.status === 0) {
  console.log(`docker available: ${docker.stdout.trim()}`);
} else {
  console.log('docker unavailable: recorded as external blocker');
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('rc status ok');
