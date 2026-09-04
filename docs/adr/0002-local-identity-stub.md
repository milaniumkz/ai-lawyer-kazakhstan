# ADR 0002: Local Identity Stub For P0

## Status

Accepted

## Context

SMS/e-mail providers, production secrets, database migrations and final auth infrastructure are not yet available. The release plan still requires a complete vertical slice that can be tested without pretending external integrations are production-ready.

## Decision

Implement identity in local/stub mode with NestJS in-memory storage, deterministic OTP, refresh-token rotation, session revocation, consent version capture, profile creation and audit events. Raw IIN/BIN values are masked in outputs and audit metadata.

## Consequences

- The auth/profile flow is testable end-to-end locally.
- This is not production persistence or production SMS delivery.
- A later migration slice must replace in-memory storage with PostgreSQL migrations and provider adapters without changing public API shape unless an ADR is added.
