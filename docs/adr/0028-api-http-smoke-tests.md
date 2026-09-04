# ADR 0028: API HTTP Smoke Tests

Дата: 2026-09-04.

## Статус

Accepted.

## Контекст

Static OpenAPI/controller checks catch route drift, but do not prove that the Nest application boots with the global `/api/v1` prefix and serves the main vertical routes.

## Решение

- Added `services/api/src/modules/app.smoke.spec.ts`.
- The smoke test boots `AppModule` with the same global prefix and safe error filter as `main.ts`.
- It covers health, identity OTP flow, case creation, chat message, document OCR confirmation, legal source import/citation validation, generated document creation and AI usage logging.
- Added `@nestjs/testing`, `supertest` and `@types/supertest` as API dev dependencies.

## Последствия

- Backend runtime regressions are now caught by API Jest tests.
- This is in-process HTTP smoke coverage, not a deployed environment E2E test.
