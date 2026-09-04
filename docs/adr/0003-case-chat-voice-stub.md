# ADR 0003: Local Case Chat Voice Stub

## Status

Accepted

## Context

Voice/STT/TTS and production AI providers require external configuration and legal review. P0 still needs a complete intake path with deterministic tests and no fake legal authority.

## Decision

Implement cases, messages and transcript jobs in local/stub mode. Case creation supports idempotency keys. Classification is deterministic and escalates unknown/low-confidence text. Assistant fallback explicitly requires official KZ sources or expert review.

## Consequences

- The intake flow is usable locally and contract-backed.
- It is not production STT/TTS or final legal advice.
- Provider adapters and persistence will replace stubs in later slices.
