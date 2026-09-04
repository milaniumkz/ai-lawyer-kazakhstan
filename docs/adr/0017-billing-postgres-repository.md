# ADR 0017: Billing PostgreSQL Repository Foundation

Дата: 2026-09-04.

## Статус

Accepted.

## Контекст

Subscription/budget slice works in local/stub mode and tracks AI costs without personal data. Production persistence needs subscriptions, provider kill switches and AI usage ledger storage.

## Решение

- Добавлен `BillingRepository` contract.
- Добавлен `PostgresBillingRepository` for `subscriptions`, `provider_configs`, `ai_usage_events`.
- Добавлена миграция `0004_billing_subscriptions_providers.sql`.
- AI usage records store accounting metadata only; no prompts, documents, IIN/BIN or raw personal data.
- Usage increment is atomic at SQL level: `used_kzt = used_kzt + $2`.
- Runtime `BillingService` пока остается local/in-memory; Postgres adapter подключается отдельным config step.

## Последствия

- Можно подключать persistent budget controls without changing API contracts.
- Для production still required: payment provider adapter, billing reconciliation and real PostgreSQL integration smoke test.
