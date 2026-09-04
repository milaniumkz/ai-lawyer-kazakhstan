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

await expectHttp('/');
await expectHttp('/admin');
await expectHealth('/api/v1/health', 'api');
await expectHealth('/ai/health', 'ai');

if (!(await canConnect(80))) failures.push('public port 80 is not reachable');
for (const port of [3000, 3001, 3002, 8000]) {
  if (await canConnect(port)) failures.push(`internal port ${port} is reachable publicly`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`public server ok: ${baseUrl}`);
