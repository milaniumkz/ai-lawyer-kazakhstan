import { asc } from './app-store-connect-client.mjs';

const appId = process.env.ASC_APP_ID ?? '6810983647';
const appStoreVersionId = process.env.ASC_APP_STORE_VERSION_ID ?? '44a3b72a-b7ec-4e71-a664-86f7254ae56e';
const expectedBuildId = process.env.ASC_EXPECTED_BUILD_ID ?? '1b0c365e-7730-4c46-87c4-9ad91ba481ab';
const execute = process.argv.includes('--execute');
const submit = process.argv.includes('--submit');

async function getVersion() {
  return asc(`/appStoreVersions/${appStoreVersionId}?include=build,appStoreReviewDetail&fields[appStoreVersions]=versionString,appStoreState,appVersionState,build,appStoreReviewDetail&fields[builds]=version,processingState`);
}

async function getReviewSubmissions() {
  return asc(`/apps/${appId}/reviewSubmissions?include=items,appStoreVersionForReview&limit=50&fields[reviewSubmissions]=state,submittedDate,items,appStoreVersionForReview&fields[reviewSubmissionItems]=state,appStoreVersion&fields[appStoreVersions]=versionString,appStoreState,appVersionState`);
}

async function listSubmissionItems(submissionId) {
  return asc(`/reviewSubmissions/${submissionId}/items?limit=200&include=appStoreVersion&fields[reviewSubmissionItems]=state,appStoreVersion&fields[appStoreVersions]=versionString,appStoreState,appVersionState`);
}

function findIncluded(response, type) {
  return (response.included ?? []).find((item) => item.type === type);
}

async function createSubmission() {
  return asc('/reviewSubmissions', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        type: 'reviewSubmissions',
        relationships: {
          app: { data: { type: 'apps', id: appId } },
        },
      },
    }),
  });
}

async function createSubmissionItem(reviewSubmissionId) {
  return asc('/reviewSubmissionItems', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        type: 'reviewSubmissionItems',
        relationships: {
          reviewSubmission: { data: { type: 'reviewSubmissions', id: reviewSubmissionId } },
          appStoreVersion: { data: { type: 'appStoreVersions', id: appStoreVersionId } },
        },
      },
    }),
  });
}

async function submitReviewSubmission(reviewSubmissionId) {
  return asc(`/reviewSubmissions/${reviewSubmissionId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      data: {
        type: 'reviewSubmissions',
        id: reviewSubmissionId,
        attributes: { submitted: true },
      },
    }),
  });
}

const version = await getVersion();
const build = findIncluded(version, 'builds');
const reviewDetail = findIncluded(version, 'appStoreReviewDetails');
const blockers = [];

if (build?.id !== expectedBuildId) {
  blockers.push(`selected build mismatch: expected ${expectedBuildId}, got ${build?.id ?? 'none'}`);
}
if (build?.attributes?.processingState !== 'VALID') {
  blockers.push(`selected build is not VALID: ${build?.attributes?.processingState ?? 'none'}`);
}
if (!reviewDetail?.attributes?.contactPhone) {
  blockers.push('review contact phone is missing');
}

const submissions = await getReviewSubmissions();
const existingSubmission = submissions.data.find((submission) => {
  const relatedVersionId = submission.relationships?.appStoreVersionForReview?.data?.id;
  return relatedVersionId === appStoreVersionId
    || (submissions.included ?? []).some((item) => (
      item.type === 'reviewSubmissionItems'
      && submission.relationships?.items?.data?.some((link) => link.id === item.id)
      && item.relationships?.appStoreVersion?.data?.id === appStoreVersionId
    ));
});

const plan = {
  dryRun: !execute,
  appId,
  appStoreVersionId,
  version: version.data.attributes.versionString,
  state: version.data.attributes.appStoreState ?? version.data.attributes.appVersionState,
  selectedBuild: {
    id: build?.id ?? null,
    version: build?.attributes?.version ?? null,
    processingState: build?.attributes?.processingState ?? null,
  },
  existingReviewSubmission: existingSubmission
    ? { id: existingSubmission.id, state: existingSubmission.attributes?.state ?? null }
    : null,
  blockers,
  nextAction: blockers.length
    ? 'fix blockers before creating/submitting review submission'
    : execute
      ? submit
        ? 'create/reuse review submission, attach version, submit for review'
        : 'create/reuse review submission and attach version without submitting'
      : 'run with --execute to create/reuse review submission after confirming blockers are empty',
};

if (blockers.length || !execute) {
  console.log(JSON.stringify(plan, null, 2));
  process.exit(blockers.length ? 2 : 0);
}

let reviewSubmission = existingSubmission;
if (!reviewSubmission) {
  reviewSubmission = (await createSubmission()).data;
}

const items = await listSubmissionItems(reviewSubmission.id);
const hasCurrentVersionItem = items.data.some((item) => item.relationships?.appStoreVersion?.data?.id === appStoreVersionId);
if (!hasCurrentVersionItem) {
  await createSubmissionItem(reviewSubmission.id);
}

let submitted = null;
if (submit) {
  if (process.env.ASC_CONFIRM_SUBMIT !== 'YES') {
    throw new Error('Refusing to submit without ASC_CONFIRM_SUBMIT=YES');
  }
  submitted = (await submitReviewSubmission(reviewSubmission.id)).data;
}

console.log(JSON.stringify({
  ...plan,
  dryRun: false,
  reviewSubmission: {
    id: reviewSubmission.id,
    state: submitted?.attributes?.state ?? reviewSubmission.attributes?.state ?? null,
    submitted: Boolean(submitted),
  },
}, null, 2));
