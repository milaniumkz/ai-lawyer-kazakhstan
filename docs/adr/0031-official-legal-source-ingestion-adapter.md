# ADR 0031: Official Legal Source Ingestion Adapter

Дата: 2026-09-04.

## Статус

Accepted.

## Контекст

Release plan requires RAG ingestion adapters for official Kazakhstan sources or documented blockers. Official API permissions/docs are not provided, so production ingestion must not be faked.

## Решение

- Added `LegalSourceIngestionAdapter` interface.
- Added `ManualLegalSourceIngestionAdapter`.
- Declared official KZ sources: `zan.gov.kz`, `adilet.zan.kz`, `sud.gov.kz`, `gov.kz`.
- Adapter reports `manual_admin_import` mode and explicit blockers for each source requiring permission.
- Tests assert no foreign-law source host is included.

## Последствия

- RAG ingestion has a real adapter boundary and documented blockers.
- Production automatic ingestion remains blocked until official API access/documentation is provided.
