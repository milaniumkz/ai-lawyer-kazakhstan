# RC Release Manifest

Release: `v0.1.0-rc.16`

Date: 2026-09-26

## Scope

- User web app for desktop/mobile testing.
- Admin web app.
- NestJS API with PostgreSQL persistence.
- FastAPI AI service in local/stub provider mode.
- Flutter Android debug/release APKs, Play-prep AAB, branded mobile icons/launch assets and iOS App Store Connect/upload evidence.
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

- Source tag: `v0.1.0-rc.16`
- QA bundle: `dist/release/ai-lawyer-kz-v0.1.0-rc.16-release-bundle.tar.gz`
- QA bundle SHA-256: pending build
- Android APK SHA-256: `86c9724b87a2669130dcd95595a90d847e0a5d38239f20b4518c0745397aa86c`
- Android AAB SHA-256: `c1e679e519f41ed397080a50adc4f5819968cc967a1dfb0b4934b5499c8548df` (debug-signed test artifact until upload keystore is provided).
- iOS bundle id: `kz.milanium.lawyer`, latest selected App Store Connect build `1.0.1 (8)`.

## Not Production Until

- Domain and TLS are configured.
- Production secrets are provided through runtime secret storage.
- SMS/payment/storage/government integrations receive official credentials.
- Legal templates and source ingestion are formally approved.
- App Store reviewer contact phone, privacy questionnaire publication and review submission are completed.
- Google Play upload keystore and Play Console access are provided.
