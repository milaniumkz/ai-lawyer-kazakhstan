import net from 'node:net';

const baseUrl = process.env.PUBLIC_SERVER_URL ?? 'http://89.207.250.217';
const host = new URL(baseUrl).hostname;
const failures = [];

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
  const htmlNeedles = ['AI Юрист', 'Здравствуйте, Дмитрий', 'Рассказать проблему', '/_next/static/'];
  for (const needle of htmlNeedles) {
    if (!html.includes(needle)) failures.push(`public web html missing: ${needle}`);
  }

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
    'Подтвердить и создать дело',
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
  const response = await fetch(`${baseUrl}/api/v1${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      'x-correlation-id': 'public-api-demo-check',
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
  const response = await fetch(`${baseUrl}/api/v1${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      'x-correlation-id': 'public-api-demo-check',
      ...(init?.headers ?? {}),
    },
  });
  if (response.status !== expectedStatus) {
    const body = await response.text();
    failures.push(`/api/v1${path} returned ${response.status}, expected ${expectedStatus}: ${body}`);
  }
}

async function expectPublicApiDemo() {
  const suffix = Date.now().toString().slice(-7).padStart(7, '0');
  const registered = await apiJson('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      channel: 'phone',
      phone: `+7701${suffix}`,
      password: 'Demo12345',
      consentVersion: 'v1',
    }),
  });
  if (!registered?.otpId) return;

  const verified = await apiJson('/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ otpId: registered.otpId, code: '111111' }),
  });
  const userId = verified?.user?.id;
  if (!userId) {
    failures.push('/api/v1/auth/otp/verify did not return user id');
    return;
  }

  const legalCase = await apiJson('/cases', {
    method: 'POST',
    headers: { 'idempotency-key': `public-demo-${Date.now()}` },
    body: JSON.stringify({
      ownerUserId: userId,
      problemText: 'Нужно взыскать долг по договору займа. Есть расписка и переписка.',
    }),
  });
  if (!legalCase?.id) {
    failures.push('/api/v1/cases did not return case id');
    return;
  }

  const upload = await apiJson('/files/upload-sessions', {
    method: 'POST',
    body: JSON.stringify({
      caseId: legalCase.id,
      fileName: 'raspiska.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 120000,
    }),
  });
  if (!upload?.id) {
    failures.push('/api/v1/files/upload-sessions did not return upload id');
    return;
  }

  const document = await apiJson('/files/complete', {
    method: 'POST',
    body: JSON.stringify({ uploadSessionId: upload.id, sha256: `public-demo-${Date.now()}` }),
  });
  if (!document?.id) {
    failures.push('/api/v1/files/complete did not return document id');
    return;
  }

  await apiJson(`/documents/${document.id}/ocr-confirm`, {
    method: 'POST',
    body: JSON.stringify({ fields: { documentTitle: 'Расписка', amount: '1250000' } }),
  });

  const templates = await apiJson('/templates');
  const templateId = templates?.[0]?.id;
  if (!templateId) {
    failures.push('/api/v1/templates did not return a template id');
    return;
  }

  const generated = await apiJson('/documents/generate', {
    method: 'POST',
    body: JSON.stringify({
      templateId,
      caseId: legalCase.id,
      fields: {
        claimantName: 'ООО Альфа',
        respondentName: 'ООО Бета',
        claimAmount: '1250000',
        claimReason: 'договор займа',
        deadlineDate: '2026-10-01',
      },
    }),
  });
  if (!generated?.id) failures.push('/api/v1/documents/generate did not return generated document id');

  const answer = await apiJson('/rag/answer', {
    method: 'POST',
    body: JSON.stringify({ query: 'Как взыскать долг по расписке?' }),
  });
  if (!answer?.status) failures.push('/api/v1/rag/answer did not return answer status');

  const exported = await apiJson('/account/export', {
    headers: { 'x-user-id': userId },
  });
  if (exported?.user?.id !== userId) failures.push('/api/v1/account/export did not return current user');
  if (JSON.stringify(exported).includes('Demo12345')) failures.push('/api/v1/account/export leaked password');

  const deleted = await apiJson('/account', {
    method: 'DELETE',
    headers: { 'x-user-id': userId },
  });
  if (deleted?.deleted !== true) failures.push('/api/v1/account did not confirm deletion');
  await expectApiFailure('/account/export', { headers: { 'x-user-id': userId } }, 401);
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
