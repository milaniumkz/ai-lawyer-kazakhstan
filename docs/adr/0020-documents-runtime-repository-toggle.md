# ADR 0020: Documents Runtime Repository Toggle

Дата: 2026-09-04.

## Статус

Accepted.

## Контекст

Documents/evidence PostgreSQL adapter is implemented. Runtime must support persistence only by explicit configuration while keeping local RC flow deterministic without PostgreSQL.

## Решение

- `DocumentsService` supports an optional `DocumentsRepository`.
- `documentsRepositoryProvider` returns `PostgresDocumentsRepository` only when `PERSISTENCE_MODE=postgres`.
- Default mode remains local/in-memory.
- Upload sessions, duplicate hash checks, document metadata, OCR confirmation and evidence folders route through repository when enabled.
- Unit tests cover local flow and repository-backed flow.

## Последствия

- Document metadata persistence can be enabled with `PERSISTENCE_MODE=postgres` after applying migrations.
- Local/stub RC checks remain database-free.
- Real file bytes still require storage/antivirus/encryption adapters before production use.
