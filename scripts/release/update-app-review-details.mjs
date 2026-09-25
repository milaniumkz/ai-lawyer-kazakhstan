import { asc } from './app-store-connect-client.mjs';

const appStoreVersionId = process.env.ASC_APP_STORE_VERSION_ID ?? '44a3b72a-b7ec-4e71-a664-86f7254ae56e';
const execute = process.argv.includes('--execute');

const contactPhone = process.env.ASC_REVIEW_CONTACT_PHONE;
const contactFirstName = process.env.ASC_REVIEW_CONTACT_FIRST_NAME ?? 'Dmitriy';
const contactLastName = process.env.ASC_REVIEW_CONTACT_LAST_NAME ?? 'Shtrakhov';
const contactEmail = process.env.ASC_REVIEW_CONTACT_EMAIL ?? 'support@89-207-250-217.sslip.io';
const notes = process.env.ASC_REVIEW_NOTES
  ?? 'This is a Kazakhstan-focused legal assistant release candidate. Use phone login with the on-screen local RC SMS code. First-time users must complete profile fields before home access. Voice intake uses real microphone permission and records audio before transcript/classification flow. Government/payment/SMS production integrations are intentionally adapter/manual fallback until official credentials are provided. The app includes source guardrails and high-risk escalation and does not claim to replace licensed legal advice.';

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
