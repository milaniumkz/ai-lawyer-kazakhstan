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

`PERSISTENCE_MODE=postgres` enables persistent identity sessions/profiles, cases/chat/transcripts, document/evidence metadata, legal source fragments, generated legal documents and billing ledger/provider settings. PostgreSQL smoke tests still require Docker/Postgres availability.
Before production launch, run `npm run release-check:production-env` with the real runtime environment loaded. It must fail while any required secret, HTTPS URL or production integration is missing.
For a prepared server/runtime file, run `node scripts/release/check-production-env.mjs --env-file=/path/to/runtime.env --json`; the output lists missing keys/blockers but never prints secret values.

## Cloud Server Scripts

Use these scripts for the current Ubuntu test server flow:

1. `npm run deploy:package` creates a checked release archive from current `HEAD`.
2. Upload the archive to `/opt/ai-lawyer-kz.tar.gz`.
3. On the server, run `bash /opt/ai-lawyer-kz/app/scripts/deploy/server-install.sh /opt/ai-lawyer-kz.tar.gz` for a full install/update.
4. Run `bash /opt/ai-lawyer-kz/app/scripts/deploy/server-postgres-setup.sh` to install PostgreSQL 16 + pgvector, apply migrations and switch API to `PERSISTENCE_MODE=postgres`.
5. Run `bash /opt/ai-lawyer-kz/app/scripts/deploy/server-health-check.sh` after every deploy.
6. Run `bash /opt/ai-lawyer-kz/app/scripts/deploy/server-firewall.sh` to keep only SSH and HTTP public.
7. Run `bash /opt/ai-lawyer-kz/app/scripts/deploy/server-install-backup-timer.sh` to enable daily PostgreSQL dumps.
8. Run `npm run release-check:server` locally to verify public web/admin/API/AI endpoints and closed internal ports.

The scripts never store SSH credentials in the repository. Database credentials are generated on the server and stored in root-owned files only.
`server-postgres-setup.sh` is safe to rerun on the current schema: it skips table creation when the baseline exists and reapplies seed/grants.
Node/API services bind to `127.0.0.1`; Nginx is the only public application entrypoint.

## Rollback

Use immutable artifacts and database migration rollback only when the migration declares a safe rollback path. Destructive migrations require backup and expand-migrate-contract plan.
