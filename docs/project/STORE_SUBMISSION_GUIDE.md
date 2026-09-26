# Store Submission Guide

## Android

- Application ID: `kz.milanium.lawyer`.
- Display name: `AI Юрист`.
- Current release artifact: temporary-signed APK at `apps/mobile/build/app/outputs/flutter-apk/app-release.apk`, SHA-256 `86c9724b87a2669130dcd95595a90d847e0a5d38239f20b4518c0745397aa86c`.
- Current Play-prep artifact: debug-signed AAB at `apps/mobile/build/app/outputs/bundle/release/app-release.aab`, SHA-256 `c1e679e519f41ed397080a50adc4f5819968cc967a1dfb0b4934b5499c8548df`.
- Verified package: `kz.milanium.lawyer`, version `0.1.0 (3)`, min SDK `24`, target SDK `36`, permissions `RECORD_AUDIO` and `INTERNET`.
- Production signing path: copy `apps/mobile/android/key.properties.example` to ignored `apps/mobile/android/key.properties`, point `storeFile` to the real upload keystore, then rebuild `flutter build appbundle --release`.
- Signing check: `npm run android:signing-check` must pass before Google Play upload; it intentionally fails while the AAB is signed by Android Debug certificate.
- Production blocker: upload keystore and Play Console access are not provided; current APK/AAB are not production-signed.
- Required before submission: production-signed AAB, privacy/data safety, screenshots, support URL, privacy URL, data deletion URL, AI disclosure.
- Combined blocker report: `npm run release:blockers`; for prepared runtime files use `RELEASE_BLOCKERS_ENV_FILE=/path/to/runtime.env npm run release:blockers`. Each check includes a machine-readable `blockers` array.

## iOS

- Bundle ID: `kz.milanium.lawyer`.
- Display name: `AI Юрист`.
- Xcode team: `Z3NZN92Y7P`.
- Current validation/upload: build `1.0.1 (9)` with `MinimumOSVersion=15.0`, Microphone, Speech Recognition and Photo Library purpose strings validated and uploaded to App Store Connect on 2026-09-26; Delivery UUID `1b0c365e-7730-4c46-87c4-9ad91ba481ab`. Apple returned `BUILD-STATUS: VALID`.
- Current build selection: App Store Connect API attached build `1b0c365e-7730-4c46-87c4-9ad91ba481ab` to App Store version `1.0` (`44a3b72a-b7ec-4e71-a664-86f7254ae56e`).
- Prepared metadata: `docs/project/APP_STORE_METADATA.md`.
- Prepared app privacy questionnaire: `docs/project/APP_STORE_PRIVACY_QUESTIONNAIRE.md`.
- Uploaded metadata: RU App Store text/appInfo/copyright uploaded via `xcrun altool --app-store-text` and verified by download.
- Prepared screenshot assets: `docs/project/app-store-screenshots/iphone-67-dark`.
- Native screenshot evidence: `docs/project/app-store-screenshots/ios-simulator-native/01-login-native.png` captured from iPhone 17 Pro Max simulator after installing `build/ios/iphonesimulator/Runner.app`.
- Full native screenshot set: `docs/project/app-store-screenshots/ios-simulator-native-full`, generated with `scripts/mobile/capture-ios-simulator-screenshots.mjs`.
- Uploaded screenshots: App Store Connect RU `APP_IPHONE_67` set `7bc670b5-61bc-4958-a55e-9e63e6d6bbc0` has 8 screenshots, verified by API read.
- TestFlight internal testing: build `1.0.1 (9)` / `1b0c365e-7730-4c46-87c4-9ad91ba481ab` is `VALID`; internal group `test` has 3 testers; RU `whatsNew` was added through App Store Connect API on 2026-09-26.
- Prepared reviewer notes helper: `scripts/release/update-app-review-details.mjs`; blocked until real `ASC_REVIEW_CONTACT_PHONE` is provided because Apple requires `contactPhone`.
- Readiness checker: `scripts/release/check-app-store-readiness.mjs`; current API result passes app/version/build/localization/screenshots and reports only `reviewContact: missing contact phone`.
- Review submission helper: `scripts/release/prepare-app-store-review-submission.mjs`; dry-run by default, `--execute` can create/reuse the review submission and attach the app version after blockers are clear, and actual submit requires both `--submit` and `ASC_CONFIRM_SUBMIT=YES`.
- Prepared RC legal/support URLs: `/privacy`, `/terms`, `/support`, `/delete-account`.
- Required before submission/review: TestFlight check, publish privacy questionnaire in App Store Connect, fill reviewer contact phone/notes, then run `npm run app-store:review-plan` and only submit when blockers are empty.
