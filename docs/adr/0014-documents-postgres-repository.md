# ADR 0014: Documents PostgreSQL Repository Foundation

Дата: 2026-09-04.

## Статус

Accepted.

## Контекст

Documents/evidence/OCR slice работает в local/stub режиме. Для production persistence нужен adapter для upload sessions, file metadata, OCR review fields and evidence folders. Baseline schema already had `files` and `evidence_folders`; upload sessions required a separate table.

## Решение

- Добавлен `DocumentsRepository` contract.
- Добавлен `PostgresDocumentsRepository` для `upload_sessions`, `files`, `evidence_folders`.
- Добавлена миграция `0003_upload_sessions.sql`.
- OCR confirmation updates only `extracted_fields` and `status`, without replacing stored file hash.
- Runtime `DocumentsService` пока остается local/in-memory; Postgres adapter подключается отдельным config шагом.

## Последствия

- Можно подключать document persistence через DI/config без изменения API contracts.
- Для production still required: real storage adapter, antivirus adapter, encryption provider and PostgreSQL integration smoke test.
