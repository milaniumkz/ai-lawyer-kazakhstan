import net from 'node:net';

const baseUrl = process.env.PUBLIC_SERVER_URL ?? 'http://89.207.250.217';
const host = new URL(baseUrl).hostname;
const failures = [];
let sessionToken;

async function expectHttp(path, expectedStatus = 200) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: 'follow' });
  if (response.status !== expectedStatus) {
    failures.push(`${path} returned ${response.status}, expected ${expectedStatus}`);
  }
  return response;
}

async function expectHealth(path, service) {
  const response = await expectHttp(path);
  if (!response.ok) return;
  const body = await response.json();
  if (body.status !== 'ok' || body.service !== service || body.jurisdiction !== 'KZ') {
    failures.push(`${path} returned unexpected health payload: ${JSON.stringify(body)}`);
  }
}

async function expectPublicWebBundle() {
  const response = await expectHttp('/');
  if (!response.ok) return;
  const html = await response.text();
  const htmlNeedles = ['AI Юрист', '/_next/static/'];
  for (const needle of htmlNeedles) {
    if (!html.includes(needle)) failures.push(`public web html missing: ${needle}`);
  }
  const loginAsset = await fetch(`${baseUrl}/aizan-login/background-whatsapp-20260930.jpg`);
  if (!loginAsset.ok) failures.push(`/aizan-login/background-whatsapp-20260930.jpg returned ${loginAsset.status}`);

  const scriptPaths = [...html.matchAll(/src="([^"]*\/_next\/static\/chunks\/[^"]+\.js)"/g)].map((match) => match[1]);
  if (!scriptPaths.length) {
    failures.push('public web html missing Next.js chunk scripts');
    return;
  }

  const bundleText = (
    await Promise.all(
      scriptPaths.slice(0, 8).map(async (path) => {
        const script = await fetch(`${baseUrl}${path}`);
        if (!script.ok) {
          failures.push(`${path} returned ${script.status}`);
          return '';
        }
        return script.text();
      }),
    )
  ).join('\n');

  const bundleNeedles = [
    'Синхронизировать',
    'Рассказать проблему',
    'Продолжить',
    'Онбординг',
    'Вход и регистрация',
    'Главный экран',
    'Документы и доказательства',
    'Помощь',
    '/auth/register',
    '/rag/answer',
  ];
  for (const needle of bundleNeedles) {
    if (!bundleText.includes(needle)) failures.push(`public web bundle missing: ${needle}`);
  }
}

async function apiJson(path, init) {
  const hasBody = init?.body !== undefined;
  const response = await fetch(`${baseUrl}/api/v1${path}`, {
    ...init,
    headers: {
      'x-correlation-id': 'public-api-demo-check',
      ...(sessionToken ? {authorization: `Bearer ${sessionToken}`} : {}),
      ...(hasBody ? { 'content-type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  });
  const body = await response.json();
  if (!response.ok) {
    failures.push(`/api/v1${path} returned ${response.status}: ${JSON.stringify(body)}`);
    return undefined;
  }
  return body;
}

async function expectApiFailure(path, init, expectedStatus) {
  const hasBody = init?.body !== undefined;
  const response = await fetch(`${baseUrl}/api/v1${path}`, {
    ...init,
    headers: {
      'x-correlation-id': 'public-api-demo-check',
      ...(sessionToken ? {authorization: `Bearer ${sessionToken}`} : {}),
      ...(hasBody ? { 'content-type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (response.status !== expectedStatus) {
    const body = await response.text();
    failures.push(`/api/v1${path} returned ${response.status}, expected ${expectedStatus}: ${body}`);
  }
}

async function expectPublicApiDemo() {
  // Never grant a test administrator by sending a role header or mutate taxonomy/payment records.
  await expectApiFailure('/cases', {headers: {'x-user-id': '00000000-0000-4000-8000-000000000001'}}, 401);
  const registered = await apiJson('/auth/register', {
    method: 'POST', body: JSON.stringify({channel: 'email', email: `server-qa-${crypto.randomUUID()}@example.invalid`, consentVersion: 'v1'}),
  });
  if (!registered?.otpId || registered.deliveryMode !== 'stub') {
    failures.push('QA requires explicit OTP stub; real delivery is not exercised');
    return;
  }
  const verified = await apiJson('/auth/otp/verify', {method: 'POST', body: JSON.stringify({otpId: registered.otpId, code: registered.testCode})});
  sessionToken = verified?.accessToken;
  const userId = verified?.user?.id;
  if (!userId || !sessionToken) { failures.push('QA login did not return a session'); return; }
  try {
    const cases = await apiJson('/cases', {headers: {'x-user-id': userId}});
    if (!Array.isArray(cases)) failures.push('Authenticated cases did not return an array');
    await expectApiFailure('/admin/legal-categories', {headers: {'x-user-role': 'admin'}}, 403);
    const exported = await apiJson('/account/export', {headers: {'x-user-id': userId}});
    if (exported?.user?.id !== userId) failures.push('Account export returned wrong owner');
  } finally {
    const deleted = await apiJson('/account', {method: 'DELETE', headers: {'x-user-id': userId}});
    if (deleted?.deleted !== true) failures.push('QA account deletion failed');
    await expectApiFailure('/account/export', {headers: {'x-user-id': userId}}, 401);
    sessionToken = undefined;
  }
  // Full case/clarification/actual-file/generation flow is the following deployment browser E2E gate.
}

function canConnect(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port, timeout: 3000 });
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => resolve(false));
  });
}

await expectPublicWebBundle();
await expectHttp('/admin');
await expectHttp('/privacy');
await expectHttp('/terms');
await expectHttp('/support');
await expectHttp('/delete-account');
await expectHealth('/api/v1/health', 'api');
await expectHealth('/ai/health', 'ai');
await expectPublicApiDemo();

if (!(await canConnect(80))) failures.push('public port 80 is not reachable');
for (const port of [3000, 3001, 3002, 8000]) {
  if (await canConnect(port)) failures.push(`internal port ${port} is reachable publicly`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`public server ok: ${baseUrl}`);
