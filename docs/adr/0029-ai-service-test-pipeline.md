# ADR 0029: AI Service Test Pipeline

Дата: 2026-09-04.

## Статус

Accepted.

## Контекст

Root checks previously compiled `services/ai/app/main.py` only. AI classifier/OCR/RAG stubs already had unittest coverage, but it was not part of the standard pipeline.

## Решение

- Added root `npm run test:ai`.
- Root `npm run check` now runs AI unittest discovery with `PYTHONPATH=services/ai/app`.
- CI Python job now runs the same AI test command.
- Added FastAPI TestClient smoke tests for AI HTTP endpoints; they are skipped when optional FastAPI runtime dependencies are not installed.

## Последствия

- AI unit regressions are now caught by local and CI checks.
- HTTP endpoint smoke coverage becomes active automatically when AI runtime dependencies are installed.
