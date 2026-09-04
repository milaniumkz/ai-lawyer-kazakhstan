# ADR 0032: Blocker-Aware Release Check

Дата: 2026-09-04.

## Статус

Accepted.

## Контекст

`release-check` previously ended with Docker config validation. In the current environment Docker is not installed, so the command failed even when all local RC gates passed. The project needs a local/internal RC check that reports Docker as an external blocker without hiding it.

## Решение

- Added `scripts/release/check-rc-status.mjs`.
- Added `npm run release-check:local`.
- `npm run release-check` now maps to local/internal RC validation.
- Added `npm run release-check:production` for local RC validation plus Docker compose config.
- RC status script validates required docs/artifacts, matrix signals, checklist open items and external blockers.

## Последствия

- Local RC readiness can be checked deterministically without Docker.
- Production release validation still fails until Docker/Postgres and external credentials are available.
