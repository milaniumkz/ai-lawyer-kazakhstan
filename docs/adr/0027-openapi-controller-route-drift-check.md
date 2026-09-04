# ADR 0027: OpenAPI Controller Route Drift Check

Дата: 2026-09-04.

## Статус

Accepted.

## Контекст

OpenAPI, generated clients and NestJS controllers must stay aligned. Previous contract check validated selected paths and generated client freshness, but did not compare all backend controller routes with OpenAPI.

## Решение

- `scripts/contracts/check-openapi.mjs` now extracts routes from `*.controller.ts`.
- NestJS `:param` routes are normalized to OpenAPI `{param}` syntax.
- The check fails if any controller route is missing in OpenAPI or any OpenAPI path has no controller route.
- Generated TypeScript/Dart client freshness checks remain unchanged.

## Последствия

- API route drift is caught in `npm run test:contract` and root `npm run check`.
- This is static coverage; runtime HTTP/E2E smoke tests are still a separate hardening task.
