# Current Slice

## Срез

Mobile voice intake transition fix and TestFlight rebuild.

## Статус

DONE -> App Store version `1.0` now has build `1.0.1 (10)` selected and TestFlight `whatsNew` updated.

## Scope

- `cd apps/mobile && /Volumes/PD1000/job/flutter/bin/flutter build ipa --release --build-name=1.0.1 --build-number=10` passed.
- IPA path: `apps/mobile/build/ios/ipa/AI Юрист.ipa`.
- IPA size: `22.3MB`.
- IPA SHA-256: `673b80ec5edbf3ffc8fee1fe4ccd4791684ff4550ee89b4e36fbe2ed02edb46e`.
- IPA `Info.plist` confirms bundle `kz.milanium.lawyer`, version `1.0.1`, build `10`, iOS `15.0`.
- `xcrun altool --validate-app` passed with no errors.
- `xcrun altool --upload-app` succeeded with Delivery UUID `93dc3818-af05-431a-8eb7-071b81f646a1`.
- `xcrun altool --build-status` returned `BUILD-STATUS: VALID`.
- App Store Connect API listed app `6810983647`, appStoreVersion `44a3b72a-b7ec-4e71-a664-86f7254ae56e`, state `PREPARE_FOR_SUBMISSION`.
- App Store Connect API attached build `93dc3818-af05-431a-8eb7-071b81f646a1` to version `1.0` via `PATCH /v1/appStoreVersions/{id}/relationships/build`.
- Follow-up API read confirms selected build `93dc3818-af05-431a-8eb7-071b81f646a1`, processingState `VALID`.
- RU TestFlight `whatsNew` localization updated for build `10`.
- Voice intake fix: confirmed recognized text now routes to AI interview even if audio upload sync fails.
- Docker config is blocked locally because Docker CLI is not installed.

## Previous Scope

- OpenAI provider added for backend `/api/v1/rag/answer`.
- OpenAI provider added for AI-service `/ai/rag/safe-answer`.
- OpenAI calls are guarded by official-source confirmation and use `store=false`.
- Keys are read only from runtime env: `AI_API_KEY` or `OPENAI_API_KEY`.
- `.env.example`, deploy runtime and AI model routing docs updated.
- Deploy archive: `/tmp/ai-lawyer-kz-openai-integration-v2.tar.gz`.
- Server archive: `/opt/ai-lawyer-kz/ai-lawyer-kz-openai-integration-v2.tar.gz`.
- SHA-256: `c246be7046eb43f8d1974f80bfece33ab927271ebec329b8e981f30b962ebbd6`.
- Server env configured through `/etc/ai-lawyer-api.env` and `/etc/ai-lawyer-ai.env`.
- Server install health passed; `ai-lawyer-api`, `ai-lawyer-ai` and `nginx` are active.
- Public smoke confirmed `/api/v1/rag/answer` returns `aiProvider=openai`, `modelId=gpt-5` and a source-backed answer.
- `PUBLIC_SERVER_URL=https://89-207-250-217.sslip.io npm run release-check:server` passed.
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
- New branded IPA built with `flutter build ipa --release --build-name=1.0.1 --build-number=4`.
- New IPA SHA-256: `4487f28270497e1b39e8d5e96589fab148c74c8d7a780f4bd8c51eb73e693cf5`.
- New IPA `Info.plist` confirms `CFBundleShortVersionString=1.0.1`, `CFBundleVersion=4`, bundle id `kz.milanium.lawyer`, minimum iOS `15.0`, and Microphone/Photo Library/Speech Recognition purpose strings.
- `xcrun altool --validate-app` passed with no errors.
- `xcrun altool --upload-app` succeeded with Delivery UUID `ef3eedcd-a218-425e-b0a3-49089327a5a5`.
- `xcrun altool --build-status` returned `BUILD-STATUS: VALID` for Delivery UUID `ef3eedcd-a218-425e-b0a3-49089327a5a5`.
- App Store Connect app: Apple ID `6810983647`, bundle `kz.milanium.lawyer`, app version state `PREPARE_FOR_SUBMISSION`.
- `xcrun altool --app-store-text --upload` wrote RU description, keywords, promotional text, support URL, marketing URL and copyright.
- Download verification confirmed RU appInfo name `AI Юрист`, subtitle `Юрист для Казахстана`, and privacy policy URL.
- `node scripts/release/check-rc-status.mjs` passed before tagging.
- `npm run release:bundle -- v0.1.0-rc.11` passed.
- `npm run deploy:package -- /tmp/ai-lawyer-kz-rc11-current.tar.gz` passed and included full check/build gates.
- Server install health passed.
- Server `npm run test:audit` found 0 vulnerabilities.
- `PUBLIC_SERVER_URL=https://89-207-250-217.sslip.io npm run release-check:server` passed after artifact upload.
- `PUBLIC_SERVER_URL=https://89-207-250-217.sslip.io npm run release-check:server` passed after current archive install.
- Direct public mobile login smoke passed at `390x844`.
- Docker config is blocked locally because Docker CLI is not installed.
- Current web update archive: `/tmp/ai-lawyer-kz-current-web-update.tar.gz`.
- Current web update SHA-256: `bda5694a2ce03485b7394c71c46498a7e5fbf0a6518d9971831239c2c526fcc2`.
- Server archive path: `/opt/ai-lawyer-kz/ai-lawyer-kz-current-web-update.tar.gz`.
- Server install health passed and server `npm run test:audit` found 0 vulnerabilities.
- Public HTTPS release check passed after install.
- Direct public URL smoke passed for `/`, `/privacy`, `/terms`, `/support`, `/delete-account`.
- iOS IPA built with `flutter build ipa --release --build-name=1.0.1 --build-number=5`.
- iOS IPA SHA-256: `660e17b6fe0c224747357512fbd2ecbdc8e98600f65d996119c0268d2206d585`.
- IPA `Info.plist` confirms bundle `kz.milanium.lawyer`, version `1.0.1`, build `5`, iOS `15.0`, and Microphone/Photo Library/Speech Recognition purpose strings.
- `xcrun altool --validate-app` passed with no errors.
- `xcrun altool --upload-app` succeeded with Delivery UUID `95e24444-4153-4fdb-85ae-bcaf835548b1`.
- Follow-up `xcrun altool --build-status` request timed out locally; build processing/selection must be checked in App Store Connect.
- iOS IPA rebuilt with `flutter build ipa --release --build-name=1.0.1 --build-number=6`.
- iOS IPA SHA-256: `db79fcad2fbffd3d6907982fe2aa102f328fd4840ff5a55866a41297c75fd983`.
- IPA `Info.plist` confirms bundle `kz.milanium.lawyer`, version `1.0.1`, build `6`, iOS `15.0`, and Microphone/Photo Library/Speech Recognition purpose strings.
- `xcrun altool --validate-app` passed with no errors.
- `xcrun altool --upload-app` succeeded with Delivery UUID `d42bc057-b4de-4156-8b02-39165a84057a`.
- Follow-up `xcrun altool --build-status` request timed out locally; build processing/selection must be checked in App Store Connect.

## Следующий шаг

Next vertical slice: publish App Store privacy questionnaire/reviewer notes in App Store Connect and perform final review submission readiness check.
