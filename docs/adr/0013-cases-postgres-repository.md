# ADR 0013: Cases PostgreSQL Repository Foundation

Дата: 2026-09-04.

## Статус

Accepted.

## Контекст

Case/chat/voice intake slice работает в local/stub режиме. Для production persistence нужен adapter, который сохраняет дела, сообщения, transcript jobs и idempotency keys в PostgreSQL без изменения текущего воспроизводимого RC flow.

## Решение

- Добавлен `CasesRepository` contract.
- Добавлен `PostgresCasesRepository` для `legal_cases`, `messages`, `transcript_jobs`.
- Добавлена миграция `0002_case_idempotency_keys.sql`.
- Idempotency keys хранятся отдельно от текста дела и связаны с владельцем и case id.
- Runtime `CasesService` пока остается local/in-memory; Postgres adapter подключается отдельным config шагом.

## Последствия

- Можно безопасно подключать Postgres persistence через DI/config без изменения API contracts.
- Для production нужен интеграционный smoke test against real PostgreSQL и политика TTL/cleanup для idempotency keys.
