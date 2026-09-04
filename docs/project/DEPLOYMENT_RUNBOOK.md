# Deployment Runbook

## Local

1. `npm install`
2. `/Volumes/PD1000/job/flutter/bin/flutter pub get --directory apps/mobile`
3. `npm run check`
4. `npm run build`
5. `docker compose -f infra/docker-compose.yml config` when Docker is available.

Default API persistence is `PERSISTENCE_MODE=local`. Set `PERSISTENCE_MODE=postgres` together with `DATABASE_URL` only after migrations are applied.

## Production

Production deployment requires approved Kazakhstan data residency infrastructure, runtime secrets, TLS/DNS, object storage, database backups, monitoring and legal approval of workflows. Do not deploy with `.env.example` values.

`PERSISTENCE_MODE=postgres` is required for persistent identity sessions/profiles and cases/chat/transcripts. Other service adapters are implemented but still need runtime toggle wiring and PostgreSQL smoke tests before production use.

## Rollback

Use immutable artifacts and database migration rollback only when the migration declares a safe rollback path. Destructive migrations require backup and expand-migrate-contract plan.
