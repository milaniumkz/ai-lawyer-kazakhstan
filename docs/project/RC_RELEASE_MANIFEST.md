# RC Release Manifest

Release: `v0.1.0-rc.3`

Date: 2026-09-04

## Scope

- User web app for desktop/mobile testing.
- Admin web app.
- NestJS API with PostgreSQL persistence.
- FastAPI AI service in local/stub provider mode.
- Flutter Android debug/release APKs and iOS no-codesign build evidence.
- Cloud server test deployment with Nginx, systemd, UFW and PostgreSQL backups.

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

- Server path: `/opt/ai-lawyer-kz/ai-lawyer-kz-v0.1.0-rc.3.tar.gz`
- SHA-256: pending until archive build.

## Not Production Until

- Domain and TLS are configured.
- Production secrets are provided through runtime secret storage.
- SMS/payment/storage/government integrations receive official credentials.
- Legal templates and source ingestion are formally approved.
- Android/iOS production signing credentials are provided.
