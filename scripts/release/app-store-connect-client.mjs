import { createSign } from 'node:crypto';
import { readFileSync } from 'node:fs';

export const apiBase = 'https://api.appstoreconnect.apple.com/v1';

const keyId = process.env.ASC_KEY_ID ?? 'G8J9YL2DH3';
const issuerId = process.env.ASC_ISSUER_ID ?? '69a6de93-c892-47e3-e053-5b8c7c11a4d1';
const privateKeyPath = process.env.ASC_PRIVATE_KEY_PATH
  ?? `${process.env.HOME}/.appstoreconnect/private_keys/AuthKey_${keyId}.p8`;

function base64Url(input) {
  return Buffer.from(input).toString('base64url');
}

function token() {
  const privateKey = readFileSync(privateKeyPath, 'utf8');
  const header = base64Url(JSON.stringify({ alg: 'ES256', kid: keyId, typ: 'JWT' }));
  const payload = base64Url(JSON.stringify({
    iss: issuerId,
    aud: 'appstoreconnect-v1',
    exp: Math.floor(Date.now() / 1000) + 20 * 60,
  }));
  const data = `${header}.${payload}`;
  const signature = createSign('SHA256')
    .update(data)
    .sign({ key: privateKey, dsaEncoding: 'ieee-p1363' });
  return `${data}.${signature.toString('base64url')}`;
}

let cachedToken;

export async function asc(path, options = {}) {
  cachedToken ??= token();
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${cachedToken}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(`${options.method ?? 'GET'} ${path} failed ${response.status}: ${text}`);
  }
  return body;
}
