# ADR 0004: Documents Evidence OCR Stub

## Status

Accepted

## Context

Production storage, antivirus and OCR providers require Docker/provider access and approved secrets. The product still needs a safe document metadata and evidence flow for local testing.

## Decision

Implement upload sessions, document metadata, OCR-review confirmation and evidence folders in local/stub mode. Validate MIME/extension/size, normalize filenames, detect duplicate hashes and mark OCR output as user-review-required.

## Consequences

- Document/evidence flow is testable without real file storage.
- The app does not claim authenticity, admissibility or final OCR correctness.
- Later storage/OCR adapters can replace stubs while preserving public contracts.
