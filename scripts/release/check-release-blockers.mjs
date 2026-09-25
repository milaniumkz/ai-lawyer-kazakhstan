import { spawnSync } from 'node:child_process';

function run(name, command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    shell: false,
    ...options,
  });
  return {
    name,
    ok: result.status === 0,
    exitCode: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  };
}

function summarizeOutput(text) {
  if (!text) return '';
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  return lines.slice(-12).join('\n');
}

const productionEnvArgs = ['scripts/release/check-production-env.mjs', '--json'];
if (process.env.RELEASE_BLOCKERS_ENV_FILE) {
  productionEnvArgs.push(`--env-file=${process.env.RELEASE_BLOCKERS_ENV_FILE}`);
}

const checks = [
  run('androidSigning', 'npm', ['run', 'android:signing-check', '--silent']),
  run('appStoreReadiness', 'npm', ['run', 'app-store:readiness', '--silent']),
  run('appStoreReviewPlan', 'npm', ['run', 'app-store:review-plan', '--silent']),
  run('productionEnv', 'node', productionEnvArgs),
  run('dockerConfigAvailable', 'npm', ['run', 'docker:config', '--silent']),
];

const report = {
  ok: checks.every((check) => check.ok),
  checks: checks.map((check) => ({
    name: check.name,
    ok: check.ok,
    exitCode: check.exitCode,
    source: check.name === 'productionEnv' && process.env.RELEASE_BLOCKERS_ENV_FILE ? 'env-file' : undefined,
    summary: summarizeOutput(check.ok ? check.stdout : `${check.stdout}\n${check.stderr}`),
  })),
};

console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 2);
