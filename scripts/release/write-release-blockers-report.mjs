import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const outputPath = resolve(process.cwd(), process.env.RELEASE_BLOCKERS_REPORT_PATH ?? 'docs/project/RELEASE_BLOCKERS_REPORT.md');
const result = spawnSync(process.execPath, ['scripts/release/check-release-blockers.mjs'], {
  encoding: 'utf8',
  env: process.env,
});

function parseReport(stdout) {
  const start = stdout.indexOf('{');
  const end = stdout.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('release blocker report did not return JSON');
  }
  return JSON.parse(stdout.slice(start, end + 1));
}

function escapeCell(value) {
  return String(value).replaceAll('|', '\\|').replace(/\s+/g, ' ').trim();
}

const report = parseReport(result.stdout);
const date = process.env.RELEASE_BLOCKERS_REPORT_DATE ?? new Date().toISOString().slice(0, 10);

const lines = [
  '# Release Blockers Report',
  '',
  `Generated: ${date}.`,
  '',
  `Overall status: ${report.ok ? 'pass' : 'blocked'}.`,
  '',
  '| Check | Status | Blockers |',
  '|---|---|---|',
];

for (const check of report.checks) {
  const blockers = check.blockers?.length ? check.blockers.join('<br>') : 'none';
  lines.push(`| ${escapeCell(check.name)} | ${check.ok ? 'pass' : 'blocked'} | ${escapeCell(blockers)} |`);
}

lines.push(
  '',
  'Notes:',
  '',
  '- This report is generated from `node scripts/release/check-release-blockers.mjs`.',
  '- External integrations must not be faked; unresolved provider/store/Docker items remain blockers.',
  '- Secret values and runtime env-file paths are intentionally not printed.',
  '',
);

writeFileSync(outputPath, `${lines.join('\n')}`);
console.log(`release blockers report written: ${outputPath}`);

process.exit(report.ok ? 0 : 2);
