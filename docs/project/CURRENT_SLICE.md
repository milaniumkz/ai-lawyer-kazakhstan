# Current Slice

## Срез

Mobile release branding assets.

## Статус

DONE locally.

## Scope

- Replaced default Flutter launcher icons with branded AI Lawyer Kazakhstan assets for Android and iOS.
- Replaced default iOS launch image with branded navy/gold launch assets.
- Android release APK rebuilt from the current stable source after branding refresh.
- APK path: `apps/mobile/build/app/outputs/flutter-apk/app-release.apk`.
- APK size: 51.3 MB.
- APK SHA-256: `0383765b24ac3097e844f81b04c6c48be74bb9078fa7a8e3d75f4b9a9d7b9b8f`.
- Package id: `kz.milanium.lawyer`.
- Version: `0.1.0`, versionCode `3`.
- Permissions include `android.permission.RECORD_AUDIO` and `android.permission.INTERNET`.
- iOS release no-codesign build passed: `apps/mobile/build/ios/iphoneos/Runner.app` at 28.5 MB.
- iOS bundle id: `kz.milanium.lawyer`, version `0.1.0 (3)`, minimum iOS `15.0`.
- iOS 1024 icon SHA-256: `3ccb5ac11908ae5070121e3da276d6a307ebdabf8cd966bf5615153c9fe14c83`.
- `/Volumes/PD1000/job/flutter/bin/flutter analyze apps/mobile` passed.
- Flutter tests passed: 33 widget/golden/route tests.
- Docker config is blocked locally because Docker CLI is not installed.

## Следующий шаг

Next vertical slice: refresh release bundle/checksums or continue Flutter parity/release packaging.
