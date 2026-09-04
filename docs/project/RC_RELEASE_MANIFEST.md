# RC Release Manifest

Release: `v0.1.0-rc.4`

Date: 2026-09-04

## Scope

- User web app for desktop/mobile testing.
- Admin web app.
- NestJS API with PostgreSQL persistence.
- FastAPI AI service in local/stub provider mode.
- Flutter Android debug/release APKs and iOS no-codesign build evidence.
- Cloud server test deployment with Nginx, systemd, UFW and PostgreSQL backups.
- Interactive mobile/web RC flows with covered button actions in local/stub mode.

## Public Test URLs

- Web: `http://89.207.250.217/`
- Admin: `http://89.207.250.217/admin`
- API health: `http://89.207.250.217/api/v1/health`
- AI health: `http://89.207.250.217/ai/health`

## Release Gates

- `npm run release-check:local` must pass.
- `npm run release-check:server` must pass.
- Server `server-health-check.sh` must pass.
- Docker, domain/TLS, store signing and external integrations remain documented blockers.

## Source Archive

- Server path: pending `v0.1.0-rc.4` archive upload
- SHA-256: pending

## Not Production Until

- Domain and TLS are configured.
- Production secrets are provided through runtime secret storage.
- SMS/payment/storage/government integrations receive official credentials.
- Legal templates and source ingestion are formally approved.
- Android/iOS production signing credentials are provided.
