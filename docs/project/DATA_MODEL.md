# Data Model

Baseline migration: `infra/db/migrations/0001_initial_schema.sql`.

Core aggregates:

- Identity: `users`, `sessions`, `profiles`.
- Legal work: `legal_cases`, `messages`, `transcript_jobs`.
- Documents: `files`, `evidence_folders`.
- RAG: `legal_source_fragments` with `vector(1536)`.
- Drafting: `templates`, `generated_documents`.
- Operations: `ai_usage_events`, `audit_logs`.

PII rule: raw IIN/BIN, bank data and secrets must not appear in logs, telemetry or AI usage rows. Persistence uses encrypted/hash-ready columns for sensitive identifiers.
