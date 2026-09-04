# ADR 0024: Database Migration Contract Check

Дата: 2026-09-04.

## Статус

Accepted.

## Контекст

Docker/PostgreSQL недоступны в текущем окружении, но repository adapters уже завязаны на конкретные таблицы и колонки. Нужна быстрая проверка drift между migrations/seeds и backend expectations.

## Решение

- Добавлен `scripts/db/check-migrations.mjs`.
- Проверка валидирует порядок migration файлов, ключевые таблицы/колонки, `pgvector` extension/column and template seed.
- Root `npm run check` теперь запускает `npm run test:migrations`.

## Последствия

- Drift в SQL baseline ловится без Docker.
- Это не заменяет real PostgreSQL smoke test; он остается blocked until Docker/Postgres is available.
