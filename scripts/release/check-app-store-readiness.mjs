import { asc } from './app-store-connect-client.mjs';

const appId = process.env.ASC_APP_ID ?? '6810983647';
const appStoreVersionId = process.env.ASC_APP_STORE_VERSION_ID ?? '44a3b72a-b7ec-4e71-a664-86f7254ae56e';
const locale = process.env.ASC_LOCALE ?? 'ru';
const displayType = process.env.ASC_SCREENSHOT_DISPLAY_TYPE ?? 'APP_IPHONE_67';
const expectedBuildId = process.env.ASC_EXPECTED_BUILD_ID ?? '4137cf18-be24-42a1-ba59-7ff7153e4612';
const expectedScreenshotCount = Number(process.env.ASC_EXPECTED_SCREENSHOT_COUNT ?? '8');

async function getVersion() {
  return asc(`/appStoreVersions/${appStoreVersionId}?include=build,appStoreVersionLocalizations,appStoreReviewDetail&fields[appStoreVersions]=versionString,appStoreState,appVersionState,build,appStoreVersionLocalizations,appStoreReviewDetail&fields[builds]=version,uploadedDate,processingState`);
}

async function getScreenshots(localizationId) {
  const sets = await asc(`/appStoreVersionLocalizations/${localizationId}/appScreenshotSets?limit=200`);
  const set = sets.data.find((item) => item.attributes.screenshotDisplayType === displayType);
  if (!set) return { setId: null, screenshots: [] };
  const screenshots = await asc(`/appScreenshotSets/${set.id}/appScreenshots?limit=200`);
  return { setId: set.id, screenshots: screenshots.data };
}

function pass(value, detail) {
  return { ok: Boolean(value), detail };
}

const version = await getVersion();
const included = version.included ?? [];
const build = included.find((item) => item.type === 'builds');
const localization = included.find((item) => item.type === 'appStoreVersionLocalizations' && item.attributes.locale === locale)
  ?? included.find((item) => item.type === 'appStoreVersionLocalizations');
const reviewDetail = included.find((item) => item.type === 'appStoreReviewDetails');
const screenshots = localization ? await getScreenshots(localization.id) : { setId: null, screenshots: [] };

const screenshotStates = screenshots.screenshots.map((item) => item.attributes.assetDeliveryState?.state);
const validScreenshotStates = new Set(['UPLOAD_COMPLETE', 'COMPLETE']);
const checks = {
  appId: pass(appId === '6810983647', appId),
  appStoreVersion: pass(version.data.id === appStoreVersionId, `${version.data.attributes.versionString} / ${version.data.attributes.appStoreState ?? version.data.attributes.appVersionState}`),
  selectedBuild: pass(build?.id === expectedBuildId && build.attributes.processingState === 'VALID', `${build?.id ?? 'none'} / ${build?.attributes?.processingState ?? 'none'}`),
  localization: pass(Boolean(localization?.id), `${localization?.attributes.locale ?? 'none'} / ${localization?.id ?? 'none'}`),
  screenshots: pass(screenshots.screenshots.length >= expectedScreenshotCount && screenshotStates.every((state) => validScreenshotStates.has(state)), `${screenshots.screenshots.length} screenshots / set ${screenshots.setId ?? 'none'} / states ${[...new Set(screenshotStates)].join(',')}`),
  reviewContact: pass(Boolean(reviewDetail?.attributes?.contactPhone), reviewDetail?.id ? `review detail ${reviewDetail.id}` : 'missing contact phone'),
};

const blockers = Object.entries(checks)
  .filter(([, result]) => !result.ok)
  .map(([name, result]) => `${name}: ${result.detail}`);

const report = {
  appId,
  appStoreVersionId,
  locale: localization?.attributes.locale ?? locale,
  displayType,
  checks,
  blockers,
};

console.log(JSON.stringify(report, null, 2));
process.exit(blockers.length === 0 ? 0 : 2);
