# Current Slice

## Срез

Android release APK refresh.

## Статус

DONE locally.

## Scope

- Android release APK rebuilt from the current stable source after web pixel gates reached 25/25.
- APK path: `apps/mobile/build/app/outputs/flutter-apk/app-release.apk`.
- APK size: 51.3 MB.
- APK SHA-256: `bdcd2eeeb3a59f433d324a1472c35fc2d5dc55811ef8cc6f3a18afdbdac0496c`.
- Package id: `kz.milanium.lawyer`.
- Version: `0.1.0`, versionCode `3`.
- Permissions include `android.permission.RECORD_AUDIO` and `android.permission.INTERNET`.
- `/Volumes/PD1000/job/flutter/bin/flutter analyze apps/mobile` passed.
- Flutter tests passed: 33 widget/golden/route tests.
- Docker config is blocked locally because Docker CLI is not installed.

## Следующий шаг

Next vertical slice: continue Flutter parity/release packaging or near-threshold web polish only when a measured change improves the diff.
