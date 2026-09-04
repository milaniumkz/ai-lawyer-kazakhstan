# Codex Handoff

Дата: 2026-09-04.

## Выполнено

- Прочитан корневой `CODEX_RELEASE_MASTER_PROMPT_AI_Юрист.md` до раздела AI/RAG.
- Подтверждено: `AGENTS.md` внутри проекта нет.
- Подтверждено: проект был пустым, кроме master prompt и дизайн PNG.
- Создан базовый монорепозиторий по целевой структуре.
- Добавлены initial design tokens для светлой и темной темы.
- Добавлены стартовые health endpoints для API и AI service.
- Добавлен OpenAPI `/health`.
- Добавлены Flutter widget test и NestJS unit test.
- Добавлены release/status/test/blocker документы.
- Дочитан master prompt до конца.
- Добавлены `AGENTS.md`, `.env.example`, `Makefile`, root release scripts и GitHub Actions CI.
- Добавлены project docs: architecture, acceptance criteria, AI routing, integrations, security, work plan.
- Исправлен Next ESLint warning через локальный admin ESLint config.
- Реализован P0-002 local/stub identity slice: phone/email OTP, refresh rotation, logout all, sessions, profiles, audit events, IIN/BIN masking.
- Добавлены Flutter экраны входа, OTP и профиля.
- Admin dashboard показывает identity audit event classes.
- Реализован P0-003 local/stub case/chat/voice intake slice: cases, messages, idempotency, transcript jobs, progress statuses, AI classifier stub.
- Добавлены Flutter экраны нового дела и чата по делу.
- Admin dashboard показывает case/chat/voice status classes.
- Реализован P0-004 local/stub documents/evidence/OCR slice: upload sessions, document metadata, OCR confirmation, evidence folders, file allowlist, duplicate hash checks.
- Добавлен FastAPI OCR stub и Flutter documents/OCR screen.
- Реализован P0-005 local/manual Legal RAG slice: official KZ source allowlist, manual source import, search, citation validation, safe refusal and AI safe answer stub.
- Добавлен Flutter legal sources/citation guardrails screen.
- Реализован P1-001 local template/document builder slice: досудебная претензия, required fields, unresolved placeholder guard, user confirmation status, expert review flag.
- Добавлен Flutter pretrial claim builder screen.
- Реализован P1-002 local subscriptions/budget slice: AI usage ledger without raw PII, budget thresholds, TTS disable flag, provider kill switch.
- Добавлен Flutter subscription screen.
- Реализован P1-003 security hardening: safe API error envelope, correlation ID, sensitive detail masking, secret/foreign-law scan.
- Реализован P1-004 release packaging: Flutter Android/iOS scaffold, `kz.ailawyer.mobile` package id, Android debug/release APK, iOS debug no-codesign build, release docs.
- Реализован P1-005 PostgreSQL migration baseline: identity/cases/documents/RAG/templates/usage/audit schema, pgvector column, template seed, OpenAPI contract check script.
- Реализован P1-006 typed clients/codegen foundation: generated TS/Dart API path contracts and freshness checks.
- Реализован P1-007 identity repository foundation: `DatabaseService`, repository interface, PostgreSQL adapter for users/sessions/profiles, hash-only persistence tests for refresh tokens and IIN/BIN.
- Реализован P1-007B cases repository foundation: PostgreSQL adapter for cases/messages/transcripts and `case_idempotency_keys` migration.
- Реализован P1-007C documents repository foundation: PostgreSQL adapter for upload sessions/files/OCR fields/evidence folders and `upload_sessions` migration.
- Реализован P1-007D legal RAG repository foundation: PostgreSQL adapter for official legal source fragments and bounded active search.
- Реализован P1-007E templates repository foundation: PostgreSQL adapter for versioned templates and generated legal documents.
- Реализован P1-007F billing repository foundation: PostgreSQL adapter for subscriptions, provider kill switch and AI usage ledger.
- Реализован P1-008 identity repository runtime toggle: `PERSISTENCE_MODE=postgres` wires identity to Postgres adapter, default local mode preserved.
- Реализован P1-009 cases repository runtime toggle: `PERSISTENCE_MODE=postgres` wires cases/chat/transcripts to Postgres adapter, default local mode preserved.
- Реализован P1-010 documents repository runtime toggle: `PERSISTENCE_MODE=postgres` wires upload sessions/documents/OCR/evidence metadata to Postgres adapter, default local mode preserved.
- Реализован P1-011 legal RAG repository runtime toggle: `PERSISTENCE_MODE=postgres` wires legal source manual import/search/citation answer lookup to Postgres adapter, default local mode preserved.
- Реализован P1-012 templates repository runtime toggle: `PERSISTENCE_MODE=postgres` wires template reads/generated legal documents to Postgres adapter, default local mode preserved.
- Реализован P1-013 billing repository runtime toggle: `PERSISTENCE_MODE=postgres` wires subscriptions/provider settings/AI usage ledger to Postgres adapter, default local mode preserved.
- Реализован P1-014 database migration contract check: validates migration order, required tables/columns, pgvector and template seed; included in root `npm run check`.
- Реализован P1-015 mobile design regression tests: light/dark home golden snapshots and core screen render smoke tests across both themes.
- Реализован P1-016 admin UI contract check: required dashboard sections, official-source wording, generated API paths and light/dark tokens; included in root `npm run check`.
- Реализован P1-017 OpenAPI/controller route drift check: all NestJS controller routes are compared against OpenAPI and generated clients.
- Реализован P1-018 API HTTP smoke tests: in-process Nest app with `/api/v1` prefix covers health, identity, cases, documents, RAG, templates and billing.
- Реализован P1-019 AI service test pipeline: root/CI run AI unittest discovery; FastAPI endpoint smoke tests skip until runtime deps are installed.
- Реализован P1-020 AI runtime dependency setup: `services/ai[dev]` installs in CI, `httpx2` added, AI HTTP smoke now runs locally with 0 skipped tests.
- Реализован P1-021 official legal source ingestion adapter: official KZ source list plus manual/admin fallback blockers, no fake production ingestion.
- Реализован P1-022 final RC acceptance matrix: internal validation status, closed criteria and external blockers.

## Дизайн-источник

- Темная тема: `дизайн/темная/*.png`, 25 экранов, 941×1672 px.
- Светлая тема: `дизайн/светлая /*.png`, 20 PNG, 941×1672 px.
- В UI нельзя использовать PNG как фон вместо нативных компонентов.

## Проверки

- Node, npm, Dart, Python и Flutter SDK доступны.
- Flutter SDK находится в `/Volumes/PD1000/job/flutter/bin/flutter`.
- `npm run check`, `npm run build`, `python3 -m py_compile services/ai/app/main.py` прошли.
- Docker отсутствует в окружении.
- Последний `npm install --workspace services/api --save-dev @types/pg` завершился с `found 0 vulnerabilities`.
- Android debug/release APK builds прошли.
- iOS debug no-codesign build прошел.

## Следующая задача

Следующая задача: Docker/PostgreSQL health checks after Docker install, production signing setup, или deeper pixel-perfect mobile/admin design parity.
