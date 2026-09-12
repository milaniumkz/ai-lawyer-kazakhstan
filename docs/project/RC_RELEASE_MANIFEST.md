# RC Release Manifest

Release: `v0.1.0-rc.11`

Date: 2026-09-12

## Scope

- User web app for desktop/mobile testing.
- Admin web app.
- NestJS API with PostgreSQL persistence.
- FastAPI AI service in local/stub provider mode.
- Flutter Android debug/release APKs, branded mobile icons/launch assets and iOS App Store Connect/upload evidence.
- Cloud server test deployment with Nginx, systemd, UFW and PostgreSQL backups.
- Interactive mobile/web RC flows with covered button actions in local/stub mode.

## Public Test URLs

- Web: `https://89-207-250-217.sslip.io/`
- Admin: `https://89-207-250-217.sslip.io/admin`
- API health: `https://89-207-250-217.sslip.io/api/v1/health`
- AI health: `https://89-207-250-217.sslip.io/ai/health`

## Release Gates

- `npm run release-check:local` must pass.
- `npm run release-check:server` must pass.
- Server `server-health-check.sh` must pass.
- Docker, domain/TLS, store signing and external integrations remain documented blockers.

## Source Archive

- Source tag: `v0.1.0-rc.11`
- QA bundle: `dist/release/ai-lawyer-kz-v0.1.0-rc.11-release-bundle.tar.gz`
- Android APK SHA-256: `0383765b24ac3097e844f81b04c6c48be74bb9078fa7a8e3d75f4b9a9d7b9b8f`
- iOS bundle id: `kz.milanium.lawyer`, version `1.0.1 (3)`.

## Not Production Until

- Domain and TLS are configured.
- Production secrets are provided through runtime secret storage.
- SMS/payment/storage/government integrations receive official credentials.
- Legal templates and source ingestion are formally approved.
- App Store Connect build selection/review submission, metadata, screenshots and reviewer notes are completed.
