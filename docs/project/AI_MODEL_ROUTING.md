# AI Model Routing

## Principle

Business logic never hardcodes provider model IDs. Runtime config maps aliases:

- `simple`
- `medium`
- `complex`
- `human_review_required`

## Signals

Routing uses category, risk, document count, context size, deadline presence, contradictions, transcript confidence, source confidence and submission/signature intent.

## Required Behavior

- Low confidence escalates upward.
- High-risk final conclusions require complex model or human review.
- No authoritative source returns `insufficient_authoritative_sources`.
- Usage logs store model alias, units, duration, estimated cost, complexity, risk and correlation IDs without raw PII.
