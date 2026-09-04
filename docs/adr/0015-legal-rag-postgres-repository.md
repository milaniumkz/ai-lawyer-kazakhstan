# ADR 0015: Legal RAG PostgreSQL Repository Foundation

Дата: 2026-09-04.

## Статус

Accepted.

## Контекст

Legal RAG slice already enforces official Kazakhstan sources and safe no-source fallback in local/manual mode. Production persistence needs a repository over `legal_source_fragments` without pretending that unavailable official APIs are integrated.

## Решение

- Добавлен `LegalRepository` contract.
- Добавлен `PostgresLegalRepository` for `legal_source_fragments`.
- Search ограничен active fragments and bounded by `LIMIT 20`.
- Adapter stores source metadata, checksum, version and embedding version; vector value population remains an AI ingestion concern.
- Runtime `LegalService` пока остается local/manual; Postgres adapter подключается отдельным config step.

## Последствия

- Можно подключать legal source persistence without changing API contracts.
- Для production still required: official source ingestion permissions/API docs, embedding pipeline, freshness jobs and real PostgreSQL/pgvector smoke tests.
