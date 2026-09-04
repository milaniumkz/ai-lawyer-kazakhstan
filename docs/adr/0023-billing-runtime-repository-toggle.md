# ADR 0023: Billing Runtime Repository Toggle

Дата: 2026-09-04.

## Статус

Accepted.

## Контекст

Billing PostgreSQL adapter is implemented. Runtime must persist subscriptions, provider kill switches and AI usage ledger only by explicit configuration while local RC flow remains deterministic.

## Решение

- `BillingService` supports an optional `BillingRepository`.
- `billingRepositoryProvider` returns `PostgresBillingRepository` only when `PERSISTENCE_MODE=postgres`.
- Subscription lookup/default creation, provider config, AI usage event creation and atomic usage increments route through repository when enabled.
- Unit tests cover local flow and repository-backed flow.

## Последствия

- Billing persistence can be enabled with `PERSISTENCE_MODE=postgres` after applying migrations.
- Payment provider integration and reconciliation remain production blockers.
