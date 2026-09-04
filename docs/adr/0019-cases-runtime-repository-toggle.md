# ADR 0019: Cases Runtime Repository Toggle

Дата: 2026-09-04.

## Статус

Accepted.

## Контекст

Cases/chat/transcripts PostgreSQL adapter is implemented. Runtime must support persistence only by explicit configuration while keeping local RC flow deterministic without PostgreSQL.

## Решение

- `CasesService` supports an optional `CasesRepository`.
- `casesRepositoryProvider` returns `PostgresCasesRepository` only when `PERSISTENCE_MODE=postgres`.
- Default mode remains local/in-memory.
- Case creation, idempotency, system message creation, chat messages and transcript jobs route through repository when enabled.
- Unit tests cover local flow and repository-backed flow.

## Последствия

- Cases persistence can be enabled with `PERSISTENCE_MODE=postgres` after applying migrations.
- Local/stub RC checks remain database-free.
- Next steps: wire documents/RAG/templates/billing runtime toggles and add real PostgreSQL smoke tests when Docker/Postgres is available.
