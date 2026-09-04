# RC Acceptance Matrix

Дата: 2026-09-04.

## Verdict

Статус: RC-ready for local/internal validation.

Не production launch: real government integrations, payment/SMS/storage credentials, legal approval, Android production signing and Apple distribution access are external blockers.

## Closed Criteria

| Area | Evidence | Status |
|---|---|---|
| Backend vertical slices | Identity, cases/chat, documents/evidence, RAG, templates, billing implemented with local mode and PostgreSQL adapters | pass |
| Persistence | Migrations `0001`-`0004`, repository adapters, runtime `PERSISTENCE_MODE=postgres` toggle | pass |
| Contracts | OpenAPI parse, generated TS/Dart clients, controller route drift check | pass |
| API runtime | In-process Nest HTTP smoke across `/api/v1` key routes | pass |
| AI service | Classifier/OCR/RAG unit tests and active FastAPI HTTP smoke tests | pass |
| Mobile | Android debug/release APK builds, iOS debug no-codesign build, Flutter analyze/test/goldens | pass |
| Admin | Next build plus static UI contract check for sections, API paths and light/dark tokens | pass |
| Security | Safe error envelope, correlation ID, secret/foreign-law scan, no raw PII in AI ledger tests | pass |
| Legal guardrails | Official KZ source allowlist, citation validation, no-source fallback, manual ingestion blockers | pass |
| Docs | Architecture, integrations, security, deployment runbook, store guide, blockers, release notes | pass |

## Blocked Criteria

| Area | Blocker | Required To Close |
|---|---|---|
| Docker health | Docker is not installed in this environment | Install Docker and run `npm run docker:config` plus service health checks |
| Government integrations | Official API permissions/docs are not provided | Signed access/docs for Smart Bridge, Судебный кабинет, e-Otinish and legal source ingestion |
| Production signing | Android upload keystore and Apple certificates/profiles are not provided | Production credentials and store access |
| Legal approval | Templates/rules are not formally approved by licensed experts | Legal QA sign-off and versioned approval workflow |
| Production infrastructure | Secrets, TLS/DNS, KZ data residency, backups and monitoring are not provisioned | Approved deployment environment |
