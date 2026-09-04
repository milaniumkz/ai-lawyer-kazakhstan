# ADR 0012: Identity PostgreSQL Repository Foundation

Дата: 2026-09-04.

## Статус

Accepted.

## Контекст

Identity slice уже работает в local/stub режиме для release-candidate вертикального сценария. Для перехода к production persistence нужен официальный слой репозиториев, совместимый с baseline migration и не сохраняющий чувствительные значения в открытом виде.

## Решение

- Добавлен `DatabaseService` на базе `pg.Pool` и `DATABASE_URL`.
- Добавлен `IdentityRepository` contract для users, sessions и profiles.
- Добавлен `PostgresIdentityRepository`, совпадающий с таблицами `users`, `sessions`, `profiles`.
- Refresh tokens сохраняются только как SHA-256 hash.
- IIN/BIN сохраняется как hash; наружу mapper возвращает только marker `[hashed]`.
- Runtime `IdentityService` пока остается local/in-memory, чтобы не ломать stub flow без Postgres config.

## Последствия

- Можно подключать Postgres через DI/config отдельным шагом.
- Текущий RC flow остается воспроизводимым без внешней БД.
- Для production потребуется encryption provider для `*_encrypted` колонок и миграционный smoke test against real PostgreSQL.
