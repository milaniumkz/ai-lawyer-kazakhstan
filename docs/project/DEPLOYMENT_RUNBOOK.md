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
For a prepared server/runtime file, run `node scripts/release/check-production-env.mjs --env-file=/path/to/runtime.env --json`; the output lists missing keys/blockers but never prints secret values or the runtime file path.
For the combined release report against the same file, run `RELEASE_BLOCKERS_ENV_FILE=/path/to/runtime.env npm run release:blockers`.

## Cloud Server Scripts

Use these scripts for the current Ubuntu test server flow:

1. `npm run deploy:package` runs server-only gates (web/admin/API/AI) and creates a checked release archive from current `HEAD`. Flutter gates remain separate in CI because mobile binaries are not installed on this server.
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

## AIZAN deployment through GitHub Actions

The manual `Deploy Web` workflow uses existing GitHub secrets `SERVER_HOST`, `SERVER_USER`, `SERVER_SSH_PORT` (defaults to 22), `SERVER_SSH_PRIVATE_KEY` and `PUBLIC_SERVER_URL`. The SSH key stays in the runner and is removed after use. GitHub never returns a stored secret value through its API. No key needs to be committed or pasted into chat.

Choose the prepared `deploy/aizan-server` branch when dispatching the workflow so the package includes the new AIZAN sources. The workflow backs up PostgreSQL, keeps the server's existing environment file, installs all four services, checks public endpoints and the exact AIZAN asset, and restores the preceding application version if installation fails. Database restoration remains a separate operator action.

As of preparation, the cloud environment blocks api.github.com and the server HTTPS host; these domains are saved in the configuration draft but require publication. Secret presence and an actual deployment have not been confirmed.
