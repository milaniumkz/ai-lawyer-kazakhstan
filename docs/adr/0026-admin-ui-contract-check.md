# ADR 0026: Admin UI Contract Check

Дата: 2026-09-04.

## Статус

Accepted.

## Контекст

Admin dashboard is a compact RC operations surface. It needs a fast regression check for required sections, official-source wording, API path visibility and light/dark design tokens without requiring browser automation.

## Решение

- Added `scripts/admin/check-ui-contract.mjs`.
- Added root script `npm run test:admin-ui`.
- Root `npm run check` now includes the admin UI contract check.
- The check validates dashboard sections, key OpenAPI paths and CSS/token consistency for light/dark colors.
- Corrected guardrail wording to "официальным источникам РК".

## Последствия

- Admin regressions are caught in the standard check pipeline.
- This is a static regression contract, not a full visual browser/E2E test.
