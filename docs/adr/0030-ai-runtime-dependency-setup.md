# ADR 0030: AI Runtime Dependency Setup

Дата: 2026-09-04.

## Статус

Accepted.

## Контекст

AI HTTP smoke tests were present but skipped locally because FastAPI TestClient dependencies were not installed. CI also needed an explicit AI dependency installation step.

## Решение

- Added `httpx2` to AI dev dependencies because current Starlette TestClient requires it.
- CI Python job now runs `python -m pip install -e "services/ai[dev]"` before AI tests.
- Local AI dev dependencies were installed and `npm run test:ai` now runs all AI unit/HTTP smoke tests without skips.

## Последствия

- AI classifier/OCR/RAG endpoint regressions are covered when running `npm run check`.
- Dependency installation remains explicit and reproducible via `services/ai/pyproject.toml`.
