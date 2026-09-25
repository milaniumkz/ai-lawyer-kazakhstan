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

function parseJsonOutput(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

function extractBlockers(check) {
  const text = check.ok ? check.stdout : `${check.stdout}\n${check.stderr}`;
  const json = parseJsonOutput(text);
  if (Array.isArray(json?.blockers)) return json.blockers;
  if (Array.isArray(json?.failures)) return json.failures;
  if (json?.message) return [json.message];
  return check.ok ? [] : summarizeOutput(text).split('\n').filter(Boolean);
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
  checks: checks.map((check) => {
    const text = check.ok ? check.stdout : `${check.stdout}\n${check.stderr}`;
    return {
      name: check.name,
      ok: check.ok,
      exitCode: check.exitCode,
      source: check.name === 'productionEnv' && process.env.RELEASE_BLOCKERS_ENV_FILE ? 'env-file' : undefined,
      blockers: extractBlockers(check),
      summary: summarizeOutput(text),
    };
  }),
};

console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 2);
