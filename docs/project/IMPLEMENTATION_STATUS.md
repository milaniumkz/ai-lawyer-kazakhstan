# Implementation Status

Дата аудита: 2026-09-04.

| Требование | Реализация | Тест | Статус |
|---|---|---|---|
| Монорепозиторий `apps/mobile`, `apps/admin`, `services/api`, `services/ai`, `packages/contracts`, `infra`, `docs` | Создан базовый каркас, root scripts, CI, env template, AGENTS | `npm run check`, `npm run build` passed | done |
| Default светлая premium Kazakhstan theme + dark theme | Токены добавлены в Flutter и admin CSS/TS | Визуальная проверка по дизайн PNG частичная | in_progress |
| Flutter mobile app | Добавлен минимальный entrypoint, главный экран и widget test | `flutter analyze`, `flutter test` passed через `/Volumes/PD1000/job/flutter/bin/flutter` | in_progress |
| Next.js admin | Добавлена стартовая панель | `npm run typecheck`, `npm run build` passed | in_progress |
| NestJS API | Добавлен `/api/v1/health` и unit test | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` passed | in_progress |
| FastAPI AI service | Добавлен `/health` | `python3 -m py_compile services/ai/app/main.py` passed | in_progress |
| OpenAPI | Добавлен контракт `/health` | Проверяется следующими contract tests в P0-002 | in_progress |
| Docker Compose PostgreSQL/Redis/MinIO | Добавлен `infra/docker-compose.yml` | Заблокировано: Docker не установлен | in_progress |
| Identity auth/profile P0 | OpenAPI auth/profile/sessions/audit, NestJS local OTP/session/profile service, Flutter login/OTP/profile screens, admin audit visibility | `npm run check`, `npm run build`, OpenAPI YAML parse passed | done |
| Case/chat/voice intake P0 | OpenAPI cases/messages/voice transcripts, NestJS local case/message/transcript service, FastAPI classifier stub, Flutter case/chat screens, admin visibility | `npm run check`, `npm run build`, AI unittest, OpenAPI YAML parse passed | done |
| Documents/evidence/OCR P0 | OpenAPI upload/documents/evidence/OCR confirmation, NestJS local metadata service with allowlist/duplicate checks, FastAPI OCR stub, Flutter documents/OCR screen, admin visibility | `npm run check`, `npm run build`, AI unittest, OpenAPI YAML parse passed | done |
| Legal RAG/anti-hallucination P0 | OpenAPI legal source manual import/search/citation validation/RAG answer, NestJS official-source guardrails, FastAPI safe answer stub, Flutter legal source screen, admin visibility | `npm run check`, `npm run build`, AI unittest, OpenAPI YAML parse passed | done |
| Legal workflows/document builder P1 | OpenAPI templates/document generation, NestJS local versioned template engine, dосудебная претензия draft, required fields, unresolved placeholder guard, expert review flag, Flutter builder screen, admin visibility | `npm run check`, `npm run build`, OpenAPI YAML parse passed | done |
| Subscriptions/budget/admin P1 | OpenAPI subscriptions/AI usage/providers, NestJS local usage ledger, budget thresholds, TTS disable flag, provider kill switch, Flutter subscription screen, admin visibility | `npm run check`, `npm run build`, OpenAPI YAML parse passed | done |
| Security/compliance hardening P1 | NestJS safe error envelope with correlation ID, sensitive detail masking, security scan for secrets and forbidden РФ legal tokens, docs update | `npm run check`, `npm run build`, security scan passed | done |
| Release candidate packaging P1 | Flutter Android/iOS platform scaffold, project package IDs, Android debug/release APK, iOS debug no-codesign build, release docs/checksums | Android debug/release build passed, iOS debug no-codesign build passed | done |
| PostgreSQL migration baseline P1 | Initial SQL schema for identity, cases, chat, documents, evidence, legal source fragments with pgvector, templates, generated documents, AI usage, audit logs; template seed; contract check script | `npm run check`, `node scripts/contracts/check-openapi.mjs`, migration text inspection passed | done |
| Typed clients/codegen foundation P1 | OpenAPI path generator, generated TypeScript and Dart API path contracts, contract freshness check, admin/mobile usage | `npm run check`, `npm run build` passed | done |
| Identity PostgreSQL repository P1 | `DatabaseService`, identity repository interface and PostgreSQL adapter for users/sessions/profiles; refresh token and IIN/BIN hashing before persistence | API lint/typecheck/test passed, 28 tests | done |
| Cases PostgreSQL repository P1 | Case repository interface, PostgreSQL adapter for cases/messages/transcripts, idempotency key migration | API lint/typecheck/test passed, 33 tests | done |
| Documents PostgreSQL repository P1 | Document repository interface, PostgreSQL adapter for upload sessions/files/OCR fields/evidence folders, upload session migration | API lint/typecheck/test passed, 38 tests | done |
| Legal RAG PostgreSQL repository P1 | Legal repository interface and PostgreSQL adapter for official source fragments/search/citation storage metadata | API lint/typecheck/test passed, 41 tests | done |
| Templates PostgreSQL repository P1 | Template repository interface and PostgreSQL adapter for templates/generated documents/expert review metadata | API lint/typecheck/test passed, 45 tests | done |
| Billing PostgreSQL repository P1 | Billing repository interface, subscriptions/provider config migration, PostgreSQL adapter for AI usage ledger without raw PII | API lint/typecheck/test passed, 50 tests | done |
| Identity repository runtime toggle P1 | `PERSISTENCE_MODE=postgres` optional repository wiring for identity service, local default preserved | API lint/typecheck/test passed, 51 tests | done |
| Cases repository runtime toggle P1 | `PERSISTENCE_MODE=postgres` optional repository wiring for cases/chat/transcripts, local default preserved | API lint/typecheck/test passed, 52 tests | done |
| Documents repository runtime toggle P1 | `PERSISTENCE_MODE=postgres` optional repository wiring for upload sessions/documents/OCR/evidence, local default preserved | API lint/typecheck/test passed, 53 tests | done |
| Legal RAG repository runtime toggle P1 | `PERSISTENCE_MODE=postgres` optional repository wiring for manual import/search/citation answer source lookup, local default preserved | API lint/typecheck/test passed, 54 tests | done |
| Templates repository runtime toggle P1 | `PERSISTENCE_MODE=postgres` optional repository wiring for template reads/generated documents, local default preserved | API lint/typecheck/test passed, 55 tests | done |
| Billing repository runtime toggle P1 | `PERSISTENCE_MODE=postgres` optional repository wiring for subscriptions/provider settings/AI usage ledger, local default preserved | API lint/typecheck/test passed, 56 tests | done |
| Database migration contract check P1 | Node script validates migration order, required PostgreSQL tables/columns, pgvector and template seed; included in root check | `npm run test:migrations`, `npm run check`, `npm run build` passed | done |
| Mobile design regression tests P1 | Flutter light/dark golden snapshots for home screen and render smoke tests for core release screens in both themes | Flutter analyze/test passed, 11 widget/golden tests; `npm run check`, `npm run build` passed | done |
| Admin UI contract check P1 | Static regression check for dashboard sections, official KZ guardrail wording, API paths and light/dark token consistency; included in root check | `npm run test:admin-ui`, `npm run check`, `npm run build` passed | done |
| OpenAPI controller route drift check P1 | Contract checker compares all NestJS controller routes against OpenAPI paths and generated clients | `npm run test:contract`, `npm run check`, `npm run build` passed | done |
| API HTTP smoke tests P1 | In-process Nest app smoke test with `/api/v1` global prefix across health/identity/cases/documents/RAG/templates/billing routes | API tests passed, 15 suites/58 tests; `npm run check`, `npm run build` passed | done |
| AI service test pipeline P1 | Root/CI run AI unittest discovery; HTTP TestClient smoke tests added and skipped until FastAPI runtime deps are installed locally | `npm run test:ai`, `npm run check`, `npm run build` passed | done |

## Блокеры окружения

- `docker` не установлен.
- Production government/payment/SMS/storage provider credentials are not provided; all related integrations stay in official adapter + local/manual mode.
