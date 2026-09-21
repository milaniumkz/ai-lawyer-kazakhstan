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
- Current validation/upload: build `1.0.1 (6)` with `MinimumOSVersion=15.0`, Microphone, Speech Recognition and Photo Library purpose strings validated and uploaded to App Store Connect on 2026-09-21; Delivery UUID `d42bc057-b4de-4156-8b02-39165a84057a`. Apple accepted the upload; the follow-up build-status request timed out locally, so processing/selection must be checked in App Store Connect.
- Prepared metadata: `docs/project/APP_STORE_METADATA.md`.
- Uploaded metadata: RU App Store text/appInfo/copyright uploaded via `xcrun altool --app-store-text` and verified by download.
- Prepared screenshot assets: `docs/project/app-store-screenshots/iphone-67-dark`.
- Prepared RC legal/support URLs: `/privacy`, `/terms`, `/support`, `/delete-account`.
- Required before submission/review: select the processed build in App Store Connect, TestFlight check, privacy questionnaire/review, native iOS screenshots and reviewer notes.
