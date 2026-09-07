# RC Release Manifest

Release: `v0.1.0-rc.9`

Date: 2026-09-07

## Scope

- User web app for desktop/mobile testing.
- Admin web app.
- NestJS API with PostgreSQL persistence.
- FastAPI AI service in local/stub provider mode.
- Flutter Android debug/release APKs and iOS no-codesign build evidence.
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

- Source tag: `v0.1.0-rc.9`
- QA bundle: `dist/release/ai-lawyer-kz-v0.1.0-rc.9-release-bundle.tar.gz`
- Android APK SHA-256: `32d35a190c6d54128b68005acd261e31ddbc76642aaa2e4ad6548f25c6681aec`

## Not Production Until

- Domain and TLS are configured.
- Production secrets are provided through runtime secret storage.
- SMS/payment/storage/government integrations receive official credentials.
- Legal templates and source ingestion are formally approved.
- Android/iOS production signing credentials are provided.
