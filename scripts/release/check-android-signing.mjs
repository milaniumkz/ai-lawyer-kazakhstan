import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = process.cwd();
const aabPath = resolve(root, process.env.ANDROID_AAB_PATH ?? 'apps/mobile/build/app/outputs/bundle/release/app-release.aab');
const keyPropertiesPath = resolve(root, 'apps/mobile/android/key.properties');

function fail(message, detail = {}) {
  console.log(JSON.stringify({ ok: false, message, ...detail }, null, 2));
  process.exit(2);
}

if (!existsSync(aabPath)) {
  fail('Android AAB not found', { aabPath });
}

const result = spawnSync('keytool', ['-printcert', '-jarfile', aabPath], {
  encoding: 'utf8',
});

if (result.status !== 0) {
  fail('Unable to inspect Android AAB signing certificate', {
    aabPath,
    stderr: result.stderr.trim(),
  });
}

const output = result.stdout;
const debugSigned = output.includes('CN=Android Debug');
const hasUploadKeyConfig = existsSync(keyPropertiesPath);

const report = {
  ok: !debugSigned && hasUploadKeyConfig,
  aabPath,
  keyPropertiesPresent: hasUploadKeyConfig,
  debugSigned,
  certificateSummary: output
    .split('\n')
    .filter((line) => /Owner:|Issuer:|SHA256:/.test(line))
    .map((line) => line.trim()),
};

if (!report.ok) {
  report.message = debugSigned
    ? 'Android AAB is signed with Android Debug certificate'
    : 'Android upload key config is missing';
  console.log(JSON.stringify(report, null, 2));
  process.exit(2);
}

console.log(JSON.stringify(report, null, 2));
