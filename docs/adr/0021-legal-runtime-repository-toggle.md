# ADR 0021: Legal RAG Runtime Repository Toggle

Дата: 2026-09-04.

## Статус

Accepted.

## Контекст

Legal RAG PostgreSQL adapter is implemented. Runtime must support persistent source fragments only by explicit configuration while local/manual RC checks remain deterministic.

## Решение

- `LegalService` supports an optional `LegalRepository`.
- `legalRepositoryProvider` returns `PostgresLegalRepository` only when `PERSISTENCE_MODE=postgres`.
- Manual import, search, citation validation and answer source lookup route through repository when enabled.
- Official Kazakhstan source validation remains in service before persistence.
- Unit tests cover local flow and repository-backed flow.

## Последствия

- Legal source fragment persistence can be enabled with `PERSISTENCE_MODE=postgres` after applying migrations.
- This does not fake official ingestion API access; ingestion permissions and freshness jobs remain production blockers.
