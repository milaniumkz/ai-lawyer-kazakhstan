import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { asc } from './app-store-connect-client.mjs';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const appStoreVersionId = process.env.ASC_APP_STORE_VERSION_ID ?? '44a3b72a-b7ec-4e71-a664-86f7254ae56e';
const locale = process.env.ASC_LOCALE ?? 'ru';
const displayType = process.env.ASC_SCREENSHOT_DISPLAY_TYPE ?? 'APP_IPHONE_67';
const screenshotDir = resolve(root, process.env.ASC_SCREENSHOT_DIR ?? 'docs/project/app-store-screenshots/ios-simulator-native-full');
const execute = process.argv.includes('--execute');

const screenshotFiles = [
  '01-login-native.png',
  '02-home-native.png',
  '03-new-case-native.png',
  '04-category-native.png',
  '05-chat-native.png',
  '06-documents-native.png',
  '07-legal-native.png',
  '08-subscription-native.png',
].map((fileName) => resolve(screenshotDir, fileName));

async function getLocalizationId() {
  const body = await asc(`/appStoreVersions/${appStoreVersionId}/appStoreVersionLocalizations?limit=200`);
  const match = body.data.find((item) => item.attributes.locale === locale) ?? body.data[0];
  if (!match) throw new Error(`No localization found for appStoreVersion ${appStoreVersionId}`);
  return match.id;
}

async function getOrCreateSet(localizationId) {
  const sets = await asc(`/appStoreVersionLocalizations/${localizationId}/appScreenshotSets?limit=200`);
  const existing = sets.data.find((item) => item.attributes.screenshotDisplayType === displayType);
  if (existing) return existing.id;
  if (!execute) return null;
  const created = await asc('/appScreenshotSets', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        type: 'appScreenshotSets',
        attributes: { screenshotDisplayType: displayType },
        relationships: {
          appStoreVersionLocalization: {
            data: { type: 'appStoreVersionLocalizations', id: localizationId },
          },
        },
      },
    }),
  });
  return created.data.id;
}

async function listScreenshots(setId) {
  if (!setId) return [];
  const body = await asc(`/appScreenshotSets/${setId}/appScreenshots?limit=200`);
  return body.data;
}

async function uploadOne(setId, path) {
  const bytes = readFileSync(path);
  const fileName = basename(path);
  const reserved = await asc('/appScreenshots', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        type: 'appScreenshots',
        attributes: {
          fileName,
          fileSize: bytes.length,
        },
        relationships: {
          appScreenshotSet: {
            data: { type: 'appScreenshotSets', id: setId },
          },
        },
      },
    }),
  });

  const screenshotId = reserved.data.id;
  for (const operation of reserved.data.attributes.uploadOperations) {
    const offset = operation.offset ?? 0;
    const length = operation.length ?? bytes.length;
    const chunk = bytes.subarray(offset, offset + length);
    const headers = Object.fromEntries((operation.requestHeaders ?? []).map((item) => [item.name, item.value]));
    const response = await fetch(operation.url, {
      method: operation.method,
      headers,
      body: chunk,
    });
    if (!response.ok) {
      throw new Error(`Upload chunk failed for ${fileName}: ${response.status} ${await response.text()}`);
    }
  }

  const checksum = createHash('md5').update(bytes).digest('hex');
  const committed = await asc(`/appScreenshots/${screenshotId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      data: {
        type: 'appScreenshots',
        id: screenshotId,
        attributes: {
          uploaded: true,
          sourceFileChecksum: checksum,
        },
      },
    }),
  });
  return committed.data;
}

for (const file of screenshotFiles) {
  if (!existsSync(file)) throw new Error(`Missing screenshot: ${file}`);
  const size = statSync(file).size;
  if (size <= 0) throw new Error(`Empty screenshot: ${file}`);
}

const localizationId = await getLocalizationId();
const setId = await getOrCreateSet(localizationId);
const existingScreenshots = await listScreenshots(setId);

console.log(JSON.stringify({
  mode: execute ? 'execute' : 'dry-run',
  appStoreVersionId,
  locale,
  localizationId,
  displayType,
  screenshotSetId: setId,
  existingScreenshotCount: existingScreenshots.length,
  uploadCount: screenshotFiles.length,
}, null, 2));

if (!execute) {
  console.log('Dry-run only. Re-run with --execute to upload screenshots.');
  process.exit(0);
}

if (existingScreenshots.length > 0) {
  console.log('Existing screenshots are present; not uploading duplicates and not deleting anything.');
  process.exit(0);
}

const uploaded = [];
for (const file of screenshotFiles) {
  const result = await uploadOne(setId, file);
  uploaded.push({
    id: result.id,
    fileName: result.attributes.fileName,
    assetDeliveryState: result.attributes.assetDeliveryState,
  });
  console.log(`uploaded ${basename(file)} -> ${result.id}`);
}

console.log(JSON.stringify({ uploaded }, null, 2));
