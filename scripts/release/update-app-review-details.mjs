import { createSign } from 'node:crypto';
import { readFileSync } from 'node:fs';

const apiBase = 'https://api.appstoreconnect.apple.com/v1';
const appStoreVersionId = process.env.ASC_APP_STORE_VERSION_ID ?? '44a3b72a-b7ec-4e71-a664-86f7254ae56e';
const keyId = process.env.ASC_KEY_ID ?? 'G8J9YL2DH3';
const issuerId = process.env.ASC_ISSUER_ID ?? '69a6de93-c892-47e3-e053-5b8c7c11a4d1';
const privateKeyPath = process.env.ASC_PRIVATE_KEY_PATH
  ?? `${process.env.HOME}/.appstoreconnect/private_keys/AuthKey_${keyId}.p8`;
const execute = process.argv.includes('--execute');

const contactPhone = process.env.ASC_REVIEW_CONTACT_PHONE;
const contactFirstName = process.env.ASC_REVIEW_CONTACT_FIRST_NAME ?? 'Dmitriy';
const contactLastName = process.env.ASC_REVIEW_CONTACT_LAST_NAME ?? 'Shtrakhov';
const contactEmail = process.env.ASC_REVIEW_CONTACT_EMAIL ?? 'support@89-207-250-217.sslip.io';
const notes = process.env.ASC_REVIEW_NOTES
  ?? 'This is a Kazakhstan-focused legal assistant release candidate. Use phone login with the on-screen local RC SMS code. First-time users must complete profile fields before home access. Voice intake uses real microphone permission and records audio before transcript/classification flow. Government/payment/SMS production integrations are intentionally adapter/manual fallback until official credentials are provided. The app includes source guardrails and high-risk escalation and does not claim to replace licensed legal advice.';

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
async function asc(path, options = {}) {
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

const existing = await asc(`/appStoreVersions/${appStoreVersionId}/appStoreReviewDetail`);
console.log(JSON.stringify({
  mode: execute ? 'execute' : 'dry-run',
  appStoreVersionId,
  existingReviewDetailId: existing.data?.id ?? null,
  hasContactPhone: Boolean(contactPhone),
  contactFirstName,
  contactLastName,
  contactEmail,
}, null, 2));

if (!contactPhone) {
  console.error('ASC_REVIEW_CONTACT_PHONE is required by App Store Connect. Use +<country-code><number> format.');
  process.exit(2);
}

if (!execute) {
  console.log('Dry-run only. Re-run with --execute to create/update reviewer notes.');
  process.exit(0);
}

const attributes = {
  contactFirstName,
  contactLastName,
  contactPhone,
  contactEmail,
  demoAccountRequired: false,
  notes,
};

if (existing.data?.id) {
  const updated = await asc(`/appStoreReviewDetails/${existing.data.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      data: { type: 'appStoreReviewDetails', id: existing.data.id, attributes },
    }),
  });
  console.log(JSON.stringify({ updated: updated.data.id, attributes: updated.data.attributes }, null, 2));
} else {
  const created = await asc('/appStoreReviewDetails', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        type: 'appStoreReviewDetails',
        attributes,
        relationships: {
          appStoreVersion: {
            data: { type: 'appStoreVersions', id: appStoreVersionId },
          },
        },
      },
    }),
  });
  console.log(JSON.stringify({ created: created.data.id, attributes: created.data.attributes }, null, 2));
}
