# Security And Compliance

## Requirements

- Secrets come only from runtime environment or secret manager.
- Logs, traces and AI telemetry must not expose IIN/BIN, passwords, tokens, EDS secrets or raw documents.
- Admin/expert access requires least privilege, RBAC and immutable audit.
- Files use allowlisted MIME/extensions, size limits, private storage and short-lived signed URLs.
- Legal actions require preview, explicit confirmation, idempotency key and audit event.
- API errors use the standard safe envelope with `correlationId`.
- Product source is scanned for obvious hardcoded secrets, unresolved TODO/FIXME/HACK markers and forbidden РФ legal tokens.
- Production release is blocked unless `scripts/release/check-production-env.mjs` confirms HTTPS public URLs, PostgreSQL persistence, real secrets and non-stub integration modes.

## Threat Model

Primary boundaries: mobile/admin clients, API, AI service, file storage, legal source ingestion, webhooks and government handoff flows.

Key threats: prompt injection, PII exfiltration, duplicate submission, forged webhook, stale/invalid citation, privilege escalation, unsafe file upload, dependency compromise.
