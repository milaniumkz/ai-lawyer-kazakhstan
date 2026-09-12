# Current Slice

## Срез

RC11 QA release bundle.

## Статус

DONE -> uploaded to public server artifact storage.

## Scope

- Release manifest moved to `v0.1.0-rc.11`.
- Source tag `v0.1.0-rc.11` created from commit `cd12274`.
- QA release bundle built: `dist/release/ai-lawyer-kz-v0.1.0-rc.11-release-bundle.tar.gz`.
- Bundle SHA-256: `e74f48069554b853ca76b1c7d8467c05ad569492d983e4bee96bce2f2e2444db`.
- Bundle includes docs, OpenAPI, Android release APK and source archive from tag.
- Included APK SHA-256: `0383765b24ac3097e844f81b04c6c48be74bb9078fa7a8e3d75f4b9a9d7b9b8f`.
- Server artifact path: `/opt/ai-lawyer-kz/ai-lawyer-kz-v0.1.0-rc.11-release-bundle.tar.gz`.
- Server checksum matches local SHA-256.
- `node scripts/release/check-rc-status.mjs` passed before tagging.
- `npm run release:bundle -- v0.1.0-rc.11` passed.
- `PUBLIC_SERVER_URL=https://89-207-250-217.sslip.io npm run release-check:server` passed after artifact upload.
- Docker config is blocked locally because Docker CLI is not installed.

## Следующий шаг

Next vertical slice: continue store/TestFlight preparation or upload/install a fresh deploy archive if web/API changes are made.
