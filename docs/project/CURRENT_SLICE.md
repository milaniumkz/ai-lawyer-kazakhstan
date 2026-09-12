# Current Slice

## Срез

App Store iOS version evidence.

## Статус

DONE -> uploaded IPA version corrected in docs.

## Scope

- Release manifest moved to `v0.1.0-rc.11`.
- Source tag `v0.1.0-rc.11` created from commit `cd12274`.
- QA release bundle built: `dist/release/ai-lawyer-kz-v0.1.0-rc.11-release-bundle.tar.gz`.
- Bundle SHA-256: `e74f48069554b853ca76b1c7d8467c05ad569492d983e4bee96bce2f2e2444db`.
- Bundle includes docs, OpenAPI, Android release APK and source archive from tag.
- Included APK SHA-256: `0383765b24ac3097e844f81b04c6c48be74bb9078fa7a8e3d75f4b9a9d7b9b8f`.
- Server artifact path: `/opt/ai-lawyer-kz/ai-lawyer-kz-v0.1.0-rc.11-release-bundle.tar.gz`.
- Server checksum matches local SHA-256.
- Current deploy archive built from latest HEAD: `/tmp/ai-lawyer-kz-rc11-current.tar.gz`.
- Current deploy archive SHA-256: `98d143e017be62893a9b963d203e77ee570a44b0c40bb9eb3ed4d0f63c672524`.
- Current server deploy path: `/opt/ai-lawyer-kz/ai-lawyer-kz-v0.1.0-rc.11-current.tar.gz`.
- Current archive installed into `/opt/ai-lawyer-kz/app`.
- App Store Connect Delivery UUID: `22621fff-471e-4689-9fcf-51a2684d5563`.
- `xcrun altool --build-status` returned `BUILD-STATUS: VALID`.
- App Store metadata draft prepared in `docs/project/APP_STORE_METADATA.md`.
- Release notes and store submission guide updated with the current iOS state.
- App Store screenshot prep set generated in `docs/project/app-store-screenshots/iphone-67-dark`.
- 8 PNG screenshots are `1290x2796` and include login, home, voice intake, category, chat, documents, legal search and subscription.
- Web public pages added for `/privacy`, `/terms`, `/support` and `/delete-account`.
- Public release-check now verifies these pages return HTTP 200.
- Deploy archive: `/tmp/ai-lawyer-kz-store-urls-v2.tar.gz`.
- Server archive: `/opt/ai-lawyer-kz/ai-lawyer-kz-store-urls-v2.tar.gz`.
- SHA-256: `38f108199f5ee09a0ce6cb8ee2e4c39ca593c5b13e7fe85a4ef96f572d19a977`.
- Server install health passed, server `npm run test:audit` found 0 vulnerabilities.
- Public release-check passed and direct URL smoke confirmed all four pages.
- IPA `Info.plist` confirms `CFBundleShortVersionString=1.0.1`, `CFBundleVersion=3`, bundle id `kz.milanium.lawyer` and minimum iOS `15.0`.
- Docs corrected from stale `0.1.0 (3)` to uploaded `1.0.1 (3)` for App Store evidence.
- `node scripts/release/check-rc-status.mjs` passed before tagging.
- `npm run release:bundle -- v0.1.0-rc.11` passed.
- `npm run deploy:package -- /tmp/ai-lawyer-kz-rc11-current.tar.gz` passed and included full check/build gates.
- Server install health passed.
- Server `npm run test:audit` found 0 vulnerabilities.
- `PUBLIC_SERVER_URL=https://89-207-250-217.sslip.io npm run release-check:server` passed after artifact upload.
- `PUBLIC_SERVER_URL=https://89-207-250-217.sslip.io npm run release-check:server` passed after current archive install.
- Direct public mobile login smoke passed at `390x844`.
- Docker config is blocked locally because Docker CLI is not installed.

## Следующий шаг

Next vertical slice: continue App Store Connect metadata entry or capture native iOS screenshots from simulator/device.
