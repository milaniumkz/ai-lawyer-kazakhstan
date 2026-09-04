# ADR 0018: Identity Runtime Repository Toggle

Дата: 2026-09-04.

## Статус

Accepted.

## Контекст

PostgreSQL adapters are available, but release-candidate local flow must keep working without a database. Runtime switching must be explicit and must not silently pretend persistence is enabled.

## Решение

- `IdentityService` supports an optional `IdentityRepository`.
- `identityRepositoryProvider` returns `PostgresIdentityRepository` only when `PERSISTENCE_MODE=postgres`.
- Default mode remains local/in-memory for reproducible RC checks.
- Controllers can return promises; API contracts are unchanged.
- Unit tests cover both local identity flow and repository-backed identity flow.

## Последствия

- Identity persistence can be enabled by setting `PERSISTENCE_MODE=postgres` and `DATABASE_URL`.
- Without those settings, local/stub behavior stays deterministic.
- Next steps: connect cases/documents/RAG/templates/billing services through the same explicit runtime toggle and add real PostgreSQL smoke tests when Docker/Postgres is available.
