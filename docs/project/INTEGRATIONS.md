# Integrations

Each integration uses a typed adapter with modes: `disabled`, `stub`, `assisted`, `sandbox`, `production`.

| Slot | Default | Release behavior without official access |
|---|---|---|
| AI/voice provider | stub | Provider-neutral interfaces and deterministic fixtures |
| Official legal source | stub/manual | Manual/admin import, source versioning, blocker |
| Судебный кабинет | assisted | Package generation, instruction, manual receipt/status |
| eGov/Smart Bridge/signing | assisted | External handoff only, no credential storage |
| Messaging | stub | SMS/e-mail interface, no legal delivery claim |
| Payment/OCR/e-Otinish | stub/assisted | Interface and blocker until provider is approved |
