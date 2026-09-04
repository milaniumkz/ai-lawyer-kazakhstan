# ADR 0008: Safe Error Envelope And Security Scan

## Status

Accepted

## Context

The API must return machine-readable errors without leaking secrets or personal data. The project must also prevent accidental use of Russian legal tokens in product code.

## Decision

Add a global NestJS exception filter that wraps errors in the required envelope and masks sensitive detail keys. Add a lightweight security scan for obvious hardcoded secrets and forbidden РФ legal tokens in product source.

## Consequences

- API errors carry a correlation ID and safe message structure.
- The scan is not a full SAST replacement.
- More security tests are still required for RBAC, SSRF, uploads and webhook replay.
