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
- Prepared metadata: `docs/project/APP_STORE_METADATA.md`.
- Uploaded metadata: RU App Store text/appInfo/copyright uploaded via `xcrun altool --app-store-text` and verified by download.
- Prepared screenshot assets: `docs/project/app-store-screenshots/iphone-67-dark`.
- Prepared RC legal/support URLs: `/privacy`, `/terms`, `/support`, `/delete-account`.
- Required before submission/review: select the processed build in App Store Connect, TestFlight check, privacy questionnaire/review, native iOS screenshots and reviewer notes.
