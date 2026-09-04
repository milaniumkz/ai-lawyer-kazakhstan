# Test Evidence

Дата: 2026-09-04.

## Выполнено

- `pwd` — рабочая директория подтверждена.
- `git status --short --branch` — репозиторий без коммитов, исходные файлы untracked.
- `git log --oneline -15` — недоступен, потому что коммитов еще нет.
- `find . -name AGENTS.md -print` — `AGENTS.md` в проекте не найден.
- `dart --version` — Dart SDK 3.10.7 доступен.
- `node --version && npm --version` — Node v24.10.0, npm 11.6.0 доступны.
- `python3 --version` — Python 3.11.9 доступен.
- `/Volumes/PD1000/job/flutter/bin/flutter --version` — Flutter 3.41.1 доступен.
- `npm install` — зависимости установлены, создан lock-файл; npm сообщил 2 уязвимости.
- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm run build` — passed.
- OpenAPI YAML parse via Node parser — passed.
- Identity API unit tests — passed, 5 tests for OTP, refresh rotation, masking, rate limit, invalid input.
- Case/chat API unit tests — passed, 4 tests for classification, idempotency, safe assistant fallback, transcript states.
- AI classifier unittest — passed, 2 tests for alimony and low-confidence escalation.
- Documents API unit tests — passed, 5 tests for upload session, OCR confirmation, unsafe file rejection, duplicate hash, evidence folder.
- AI OCR unittest — passed, review-required OCR stub.
- Legal RAG API unit tests — passed, 4 tests for official import, citation validation, safe refusal, stale/future edition rejection.
- AI RAG unittest — passed, safe refusal without confirmed source.
- Template API unit tests — passed, 2 tests for draft generation and required fields.
- Billing API unit tests — passed, 2 tests for usage ledger and provider kill switch.
- Safe error envelope unit test — passed, correlation ID and sensitive detail masking.
- Security scan — passed for product source, packages, CI and env template.
- Flutter widget tests — passed, 7 tests for home, login route, case intake, documents OCR, legal citation, pretrial claim and subscription screen.
- Android debug build — passed, `apps/mobile/build/app/outputs/flutter-apk/app-debug.apk`, sha256 `9b3a3a97d7a443d25a4fec0ac742dcc62a1da0700f7d90568f824d4b07efe878`.
- Android release build — passed with temporary debug signing config, `apps/mobile/build/app/outputs/flutter-apk/app-release.apk`, sha256 `10506dbe4ac5f6acbcb4ac89444ae4586ba6b16de866ccbabfa5ee929b4b83fc`.
- iOS debug no-codesign build — passed, `apps/mobile/build/ios/iphoneos/Runner.app`.
- OpenAPI contract script — passed via `node scripts/contracts/check-openapi.mjs`.
- PostgreSQL baseline migration inspection — passed for `users`, `legal_source_fragments embedding vector(1536)`, `audit_logs`.
- Typed API clients generation — passed, 30 paths generated for TypeScript and Dart.
- Contract freshness check — passed inside `npm run check`.
- `npm install --workspace services/api --save-dev @types/pg` — passed, `found 0 vulnerabilities`.
- Identity PostgreSQL repository API checks — `npm run lint --workspace services/api`, `npm run typecheck --workspace services/api`, `npm test --workspace services/api` passed; 9 suites, 28 tests.
- Full project check after identity repository foundation — `npm run check` passed.
- Full Node workspace build after identity repository foundation — `npm run build` passed.
- Cases PostgreSQL repository API checks — `npm run lint --workspace services/api`, `npm run typecheck --workspace services/api`, `npm test --workspace services/api` passed; 10 suites, 33 tests.
- Full project check/build after cases repository foundation — `npm run check`, `npm run build` passed.
- Documents PostgreSQL repository API checks — `npm run lint --workspace services/api`, `npm run typecheck --workspace services/api`, `npm test --workspace services/api` passed; 11 suites, 38 tests.
- Full project check/build after documents repository foundation — `npm run check`, `npm run build` passed.
- Legal RAG PostgreSQL repository API checks — `npm run lint --workspace services/api`, `npm run typecheck --workspace services/api`, `npm test --workspace services/api` passed; 12 suites, 41 tests.
- Full project check/build after Legal RAG repository foundation — `npm run check`, `npm run build` passed.
- Templates PostgreSQL repository API checks — `npm run lint --workspace services/api`, `npm run typecheck --workspace services/api`, `npm test --workspace services/api` passed; 13 suites, 45 tests.
- Full project check/build after templates repository foundation — `npm run check`, `npm run build` passed.
- Billing PostgreSQL repository API checks — `npm run lint --workspace services/api`, `npm run typecheck --workspace services/api`, `npm test --workspace services/api` passed; 14 suites, 50 tests.
- Full project check/build after billing repository foundation — `npm run check`, `npm run build` passed.
- Identity repository runtime toggle API checks — `npm run lint --workspace services/api`, `npm run typecheck --workspace services/api`, `npm test --workspace services/api` passed; 14 suites, 51 tests.
- Full project check/build after identity runtime repository toggle — `npm run check`, `npm run build` passed.
- Cases repository runtime toggle API checks — `npm run lint --workspace services/api`, `npm run typecheck --workspace services/api`, `npm test --workspace services/api` passed; 14 suites, 52 tests.
- Full project check/build after cases runtime repository toggle — `npm run check`, `npm run build` passed.
- Documents repository runtime toggle API checks — `npm run lint --workspace services/api`, `npm run typecheck --workspace services/api`, `npm test --workspace services/api` passed; 14 suites, 53 tests.
- Full project check/build after documents runtime repository toggle — `npm run check`, `npm run build` passed.
- Legal RAG repository runtime toggle API checks — `npm run lint --workspace services/api`, `npm run typecheck --workspace services/api`, `npm test --workspace services/api` passed; 14 suites, 54 tests.
- Full project check/build after Legal RAG runtime repository toggle — `npm run check`, `npm run build` passed.
- Templates repository runtime toggle API checks — `npm run lint --workspace services/api`, `npm run typecheck --workspace services/api`, `npm test --workspace services/api` passed; 14 suites, 55 tests.
- Full project check/build after templates runtime repository toggle — `npm run check`, `npm run build` passed.
- Billing repository runtime toggle API checks — `npm run lint --workspace services/api`, `npm run typecheck --workspace services/api`, `npm test --workspace services/api` passed; 14 suites, 56 tests.
- Full project check/build after billing runtime repository toggle — `npm run check`, `npm run build` passed.
- Database migration contract check — `npm run test:migrations` passed; 4 migration files validated.
- Full project check/build after migration contract check — `npm run check`, `npm run build` passed.
- Mobile design golden generation — `cd apps/mobile && /Volumes/PD1000/job/flutter/bin/flutter test --update-goldens` passed.
- Mobile design regression checks — `flutter analyze`, `flutter test` passed; 11 tests including light/dark home golden snapshots.
- Full project check/build after mobile design regression tests — `npm run check`, `npm run build` passed.
- Admin UI contract check — `npm run test:admin-ui` passed.
- Full project check/build after admin UI contract check — `npm run check`, `npm run build` passed.
- Flutter API contract test — passed.
- `npm test` — passed, 1 API test.
- `/Volumes/PD1000/job/flutter/bin/flutter analyze` — passed.
- `/Volumes/PD1000/job/flutter/bin/flutter test` — passed, 1 widget test.
- `python3 -m py_compile services/ai/app/main.py` — passed.

## Заблокировано

- `docker --version` — `docker: command not found`.
- Production Android signing — blocked, production keystore is not provided.
- iOS archive/export for TestFlight/App Store — blocked, production Apple certificates/profiles and store account flow are not provided.

## Не запускалось

- `pytest`, `ruff`, `mypy` — зависимости AI service еще не установлены.
