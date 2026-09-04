# Server Deployment

Дата: 2026-09-04.

## Public URLs

- Web: `https://89-207-250-217.sslip.io/`
- Admin: `https://89-207-250-217.sslip.io/admin`
- API health: `https://89-207-250-217.sslip.io/api/v1/health`
- AI health: `https://89-207-250-217.sslip.io/ai/health`

## Runtime

- OS: Ubuntu 24.04 LTS.
- Reverse proxy: Nginx on ports 80/443.
- Firewall: UFW allows SSH, HTTP and HTTPS; app internals are not public.
- TLS: Let’s Encrypt certificate for `89-207-250-217.sslip.io`.
- Node services: systemd + `npm run start`.
- AI service: systemd + Uvicorn.
- API mode: `APP_ENV=staging`, `PERSISTENCE_MODE=postgres`.
- Database: local PostgreSQL 16 with `pgvector`; credentials are stored only in root-owned server files.
- Backups: daily PostgreSQL dump timer `ai-lawyer-postgres-backup.timer`.

## Systemd Services

- `ai-lawyer-web` -> Next.js web app on `127.0.0.1:3000`.
- `ai-lawyer-admin` -> Next.js admin app on `127.0.0.1:3002`.
- `ai-lawyer-api` -> NestJS API on `127.0.0.1:3001`, env file `/etc/ai-lawyer-api.env`.
- `ai-lawyer-ai` -> FastAPI AI service on `127.0.0.1:8000`.
- `nginx` -> public reverse proxy.

## Operations

```bash
systemctl status ai-lawyer-web ai-lawyer-admin ai-lawyer-api ai-lawyer-ai nginx --no-pager
journalctl -u ai-lawyer-api -n 100 --no-pager
systemctl restart ai-lawyer-web ai-lawyer-admin ai-lawyer-api ai-lawyer-ai nginx
```

## Verified Checks

```bash
curl http://89.207.250.217/api/v1/health
curl http://89.207.250.217/ai/health
curl -I http://89.207.250.217/
curl -IL http://89.207.250.217/admin
curl https://89-207-250-217.sslip.io/api/v1/health
curl https://89-207-250-217.sslip.io/ai/health
curl -I https://89-207-250-217.sslip.io/
curl -IL https://89-207-250-217.sslip.io/admin
bash /opt/ai-lawyer-kz/app/scripts/deploy/server-health-check.sh
```

PostgreSQL persistence smoke:

```bash
systemctl restart ai-lawyer-api
curl http://127.0.0.1:3001/api/v1/health
sudo -u postgres psql -d ai_lawyer_kz -tAc "SELECT count(*) FROM users;"
```

Backup check:

```bash
bash /opt/ai-lawyer-kz/app/scripts/deploy/server-backup-postgres.sh
systemctl list-timers ai-lawyer-postgres-backup.timer --no-pager
```

## Remaining Blockers

- Custom production domain/DNS is not provided; trusted test HTTPS is available through `sslip.io`.
- Real SMS, payment, storage, government and official legal source API credentials are not provided.
- Production Android signing and Apple distribution credentials are not provided.
