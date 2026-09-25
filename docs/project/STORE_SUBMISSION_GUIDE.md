# Store Submission Guide

## Android

- Application ID: `kz.milanium.lawyer`.
- Current release artifact: temporary-signed APK.
- Production blocker: upload keystore and Play Console access are not provided.
- Required before submission: AAB, privacy/data safety, screenshots, support URL, privacy URL, data deletion URL, AI disclosure.

## iOS

- Bundle ID: `kz.milanium.lawyer`.
- Display name: `AI Юрист`.
- Xcode team: `Z3NZN92Y7P`.
- Current validation/upload: build `1.0.1 (7)` with `MinimumOSVersion=15.0`, Microphone, Speech Recognition and Photo Library purpose strings validated and uploaded to App Store Connect on 2026-09-25; Delivery UUID `275d979b-9e7c-425e-891f-53b708797f1c`. Apple returned `BUILD-STATUS: VALID`.
- Current build selection: App Store Connect API attached build `275d979b-9e7c-425e-891f-53b708797f1c` to App Store version `1.0` (`44a3b72a-b7ec-4e71-a664-86f7254ae56e`).
- Prepared metadata: `docs/project/APP_STORE_METADATA.md`.
- Prepared app privacy questionnaire: `docs/project/APP_STORE_PRIVACY_QUESTIONNAIRE.md`.
- Uploaded metadata: RU App Store text/appInfo/copyright uploaded via `xcrun altool --app-store-text` and verified by download.
- Prepared screenshot assets: `docs/project/app-store-screenshots/iphone-67-dark`.
- Native screenshot evidence: `docs/project/app-store-screenshots/ios-simulator-native/01-login-native.png` captured from iPhone 17 Pro Max simulator after installing `build/ios/iphonesimulator/Runner.app`.
- Full native screenshot set: `docs/project/app-store-screenshots/ios-simulator-native-full`, generated with `scripts/mobile/capture-ios-simulator-screenshots.mjs`.
- Uploaded screenshots: App Store Connect RU `APP_IPHONE_67` set `7bc670b5-61bc-4958-a55e-9e63e6d6bbc0` has 8 screenshots, verified by API read.
- Prepared reviewer notes helper: `scripts/release/update-app-review-details.mjs`; blocked until real `ASC_REVIEW_CONTACT_PHONE` is provided because Apple requires `contactPhone`.
- Readiness checker: `scripts/release/check-app-store-readiness.mjs`; current API result passes app/version/build/localization/screenshots and reports only `reviewContact: missing contact phone`.
- Prepared RC legal/support URLs: `/privacy`, `/terms`, `/support`, `/delete-account`.
- Required before submission/review: TestFlight check, publish privacy questionnaire in App Store Connect and fill reviewer contact phone/notes.
