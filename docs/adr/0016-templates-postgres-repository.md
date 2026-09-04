# ADR 0016: Templates PostgreSQL Repository Foundation

Дата: 2026-09-04.

## Статус

Accepted.

## Контекст

Legal workflow slice generates local pre-trial claim drafts and requires user confirmation/expert review metadata. Production persistence needs repository access to versioned templates and generated documents.

## Решение

- Добавлен `TemplatesRepository` contract.
- Добавлен `PostgresTemplatesRepository` for `templates` and `generated_documents`.
- Template listing excludes archived templates.
- Generated documents persist status, body and `expert_review_required`.
- Runtime `TemplatesService` пока остается local/in-memory; Postgres adapter подключается отдельным config step.

## Последствия

- Можно подключать template persistence without changing API contracts.
- Для production still required: expert-approved template lifecycle, legal QA and immutable document versioning policy.
