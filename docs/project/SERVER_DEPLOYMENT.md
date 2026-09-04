# Server Deployment

Дата: 2026-09-04.

## Public URLs

- Web: `http://89.207.250.217/`
- Admin: `http://89.207.250.217/admin`
- API health: `http://89.207.250.217/api/v1/health`
- AI health: `http://89.207.250.217/ai/health`

## Runtime

- OS: Ubuntu 24.04 LTS.
- Reverse proxy: Nginx on port 80.
- Node services: systemd + `npm run start`.
- AI service: systemd + Uvicorn.
- API mode: `APP_ENV=staging`, `PERSISTENCE_MODE=local`.

## Systemd Services

- `ai-lawyer-web` -> Next.js web app on `127.0.0.1:3000`.
- `ai-lawyer-admin` -> Next.js admin app on `127.0.0.1:3002`.
- `ai-lawyer-api` -> NestJS API on `127.0.0.1:3001`.
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
```

## Remaining Blockers

- No domain and TLS certificate yet; server is HTTP-only by IP.
- API uses local in-memory/local stub persistence until PostgreSQL/managed database credentials are configured.
- Real SMS, payment, storage, government and official legal source API credentials are not provided.
- Production Android signing and Apple distribution credentials are not provided.
