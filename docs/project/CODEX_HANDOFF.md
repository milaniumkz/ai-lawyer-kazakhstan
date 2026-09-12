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
- Реализован P1-023 blocker-aware release check: `release-check:local` passes without Docker while recording it as blocker; `release-check:production` keeps Docker gate.
- Реализован P1-024 responsive web app: `apps/web` Next.js surface for desktop/mobile testing with light/dark design tokens.
- Развернут тестовый cloud server: web/admin/api/ai работают через Nginx и systemd на публичном IP.
- На cloud server включен PostgreSQL 16 + pgvector, API переключен на `PERSISTENCE_MODE=postgres`.
- Добавлены воспроизводимые deploy scripts: package, server install, runtime, PostgreSQL setup, health check.
- Добавлены release ops scripts: firewall, PostgreSQL backup, daily backup timer, localhost binds.
- Закрыты placeholder-кнопки в Flutter и web: восстановление доступа, повтор OTP, запись голоса, отправка чата, загрузка/скан документов, OCR confirmation, evidence tap, генерация претензии, payment blocker и web health/actions.
- Публичный web стенд обновлен после интерактивных flow; `server-health-check.sh` прошел.
- Добавлены reusable bottom navigation, “Мои дела”, “Карточка дела”, “Сроки”, фильтры/поиск по делам и рабочие действия карточки дела.
- Web получил scenario workspace: выполнение сценария, ручная проверка, blocker state и кликабельный журнал.
- Профиль, настройки, помощь, biometric local flag и Legal Citation Validator получили рабочие действия; пустых `onTap/onPressed` в mobile/web не осталось.
- Добавлены недостающие routes из дизайн-листа: регистрация, биометрия, определение категории, анализ документов, draft/send претензии, поиск нормы права.
- Добавлен onboarding route; web получил кликабельную матрицу 25 дизайн-экранов с active screen preview.
- Исправлены главные маршруты: mic открывает voice intake, “Сроки” открывает calendar/deadlines, profile icon стабильно ведет в профиль.
- Mobile design regression smoke теперь рендерит все реализованные release screens в light/dark themes.
- Document analysis confirmation now enables transition to pretrial claim builder, closing the document-to-claim vertical flow.
- Web UI contract gate added to root check: 25 design screen labels, primary actions, responsive CSS and empty onClick guard.
- Web `API demo` button now runs real `/api/v1` calls for auth/case/upload/OCR/document generation/RAG in local/stub mode.
- Public server release check now also runs the deployed API demo path: auth OTP, case, upload/OCR, document generation and RAG.
- Design source contract gate added to root check: required dark/light PNG references and expected reference dimensions.
- Design source contract now verifies all 25 dark design screens map to web labels, mobile routes and mobile render-test widgets; web API demo phone format fixed.
- Public server release check now verifies deployed Next.js HTML/assets contain required web app labels, sync action and API route strings.
- Flutter tests now include a router-smoke that opens every implemented release route through `AiLawyerApp`/`GoRouter`.
- Public web stand UI was replaced with a stateful web application: home, cases, case card, chat, documents/OCR, deadlines, legal search, claim builder, profile/settings/subscription/help and API sync.
- Every web design screen 01-25 now maps to an exact state/view; the right screen list no longer uses grouped approximate navigation.
- Web view changes scroll to top so selected screens open from the expected header area.

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
- Public server checks passed: web 200, admin 200, API health ok, AI health ok.
- Server PostgreSQL persistence smoke passed after API restart.
- Deploy shell syntax checks passed.
- Server release ops checks passed: only SSH/HTTP public, backup dump created, timer active.
- Final `npm run release-check:local` passed after server hardening.
- RC manifest prepared for `v0.1.0-rc.3`.
- Public server release check added and passed.
- Final RC source archive uploaded to server and checksum verified.
- RC3 source archive uploaded to server and checksum verified.
- Production env gate added; production launch remains blocked until real HTTPS/secrets/integrations exist.
- QA release bundle script prepared for `v0.1.0-rc.3`.
- QA release bundle built for `v0.1.0-rc.3`.
- Final interactive-flow checks passed: Flutter analyze/test with 16 widget/golden tests, web lint/typecheck/build, `release-check:local` and `release-check:server`.
- RC4 tag/source archive/bundle prepared; source archive uploaded to server and verified.
- Latest mobile/web parity pass verified: Flutter analyze/test 18 tests, web lint/typecheck/build, server rebuild and public server check.
- Latest profile/legal completion verified: Flutter analyze/test 19 tests, web build, `release-check:local`, `release-check:server`.
- Latest 25-screen flow pass verified: Flutter analyze/test 21 tests, `release-check:local`, `release-check:server`.
- Latest onboarding/web matrix pass verified: Flutter analyze/test 22 tests, web build, server rebuild, `release-check:local`, `release-check:server`.
- Latest main route parity pass verified: Flutter analyze/test 23 tests, `release-check:local`, `release-check:server`.
- Latest full mobile render regression verified: Flutter analyze/test 23 tests, `release-check:local`, `release-check:server`.
- Latest document-to-claim flow verified: Flutter analyze/test 23 tests, `release-check:local`, `release-check:server`.
- Latest web UI contract gate verified: `npm run test:web-ui`, `release-check:local`, `release-check:server`.
- Latest web dynamic API demo verified: web lint/typecheck/build, server rebuild, `release-check:local`, `release-check:server`.
- Latest public API demo smoke verified: `release-check:server` and full `release-check:local && release-check:server`.
- Latest design source contract verified: `test:design-source` and full `release-check:local && release-check:server`.
- Latest design screen route matrix verified: `test:design-source`, web lint/typecheck/build and full release-check local/server.
- Latest public web bundle smoke verified: `release-check:server` and full `release-check:local && release-check:server`.
- Latest mobile router-smoke verified: Flutter analyze/test with 24 tests and full release-check local/server.
- Latest real web app pass verified with web UI contract, web lint/typecheck/build, local release-check, public server refresh and server release-check.
- Latest web 25-screen functional mapping verified with web UI contract, web lint/typecheck/build and local release-check.
- Latest web button semantics verified: home “Новое дело” opens the real case intake, profile/settings/subscription/help render separate functional states, and nested nav active states are consistent.
- Latest web real app shell verified: public-facing QA matrix removed from the right panel and replaced with functional case tasks, actions and document shortcuts.
- Latest web dynamic state verified: controlled forms, local persistence, file picker handoff and salary-case classification render correctly after browser reload.
- Latest web route/theme app pass verified: hash-addressable views, explicit theme toggle and case status/progress updates are included in local release check.
- Latest web mobile-design shell verified: public web no longer renders desktop sidebar/right panel; desktop centers the same app frame used on phone.
- Latest web recording/navigation pass verified: `#newCase` has recording card, pause/finish controls, finish opens category, back returns to intake, and mobile status no longer intercepts navigation.
- Latest web API-backed application pass verified: critical web buttons now update explicit app state and call `/api/v1` for auth, cases, chat, documents/OCR, RAG, claim generation and subscription limits.
- Latest web hash routing pass verified: `hashchange` now updates the visible screen, and legal norms are reachable directly from the home quick actions.
- Latest web legal design parity pass verified: home quick actions match the 3-card reference again, and legal norms now have search, category tabs, selectable cards, add-to-document and source actions.
- Latest web real-data voice pass verified: prefilled fake cases/legal norms were removed, OTP uses `/api/v1/auth/register`, voice uses browser MediaRecorder with playback and transcript job handoff.
- Latest server HTTPS mic-test pass verified: deploy runtime now creates a self-signed certificate and serves the app on 443 so MediaRecorder can be tested before production DNS/TLS.
- Latest trusted HTTPS voice endpoint verified: Let’s Encrypt certificate issued for `89-207-250-217.sslip.io`; browser mic smoke passed without ignoring certificate errors.
- Latest web real-user data pass verified and deployed: random auto-registration/sync and hardcoded web OTP acceptance were removed; voice intake now shows live browser speech-recognition status on top of real MediaRecorder capture.
- Latest web action realism pass verified: remaining status-only actions were replaced with real browser file/camera inputs, SHA-256 upload metadata, `/profiles` save, OCR-gated analysis, persistent support request, explicit claim-send confirmation and persisted settings.
- Latest deployed browser smoke verified: HTTPS OTP login, profile API save, case API save, unique PDF upload, OCR API confirmation and analysis with 1 server document.

## Следующая задача

Следующая задача: deploy admin manual payment receipt import and run public `release-check:server`, then continue remaining web pixel screens above the 4% threshold. Local gate is complete for `/admin/subscriptions/payments/manual`.
