# ADR 0022: Templates Runtime Repository Toggle

Дата: 2026-09-04.

## Статус

Accepted.

## Контекст

Templates PostgreSQL adapter is implemented. Runtime must persist template reads and generated legal documents only by explicit configuration while local RC flow remains deterministic.

## Решение

- `TemplatesService` supports an optional `TemplatesRepository`.
- `templatesRepositoryProvider` returns `PostgresTemplatesRepository` only when `PERSISTENCE_MODE=postgres`.
- Template list/find and generated document creation/listing route through repository when enabled.
- Required fields and unresolved placeholder guardrails remain in service before persistence.
- Unit tests cover local flow and repository-backed flow.

## Последствия

- Generated legal documents can be persisted with `PERSISTENCE_MODE=postgres` after migrations/seeds.
- Expert approval lifecycle and immutable document version policy remain production hardening tasks.
