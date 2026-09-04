# ADR 0007: Local Budget Ledger And Kill Switch

## Status

Accepted

## Context

Production billing, payment provider and AI provider cost APIs are not configured. The system still needs observable budget behavior and a provider kill switch.

## Decision

Implement local AI usage ledger with provider/model alias, units, estimated cost, complexity, risk and correlation ID. Exclude raw PII fields. Add threshold reporting and provider kill switch.

## Consequences

- Budget behavior is testable locally.
- Real payments and provider invoices remain external integrations.
- Production cost accuracy requires provider configuration and approved pricing data.
