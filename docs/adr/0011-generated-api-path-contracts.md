# ADR 0011: Generated API Path Contracts

## Status

Accepted

## Context

OpenAPI is the source of truth, but full client generation would add toolchain complexity before repository persistence is complete.

## Decision

Generate lightweight TypeScript and Dart API path contracts from OpenAPI and enforce freshness in the contract check.

## Consequences

- Admin and mobile can reference shared API paths now.
- This is not a full typed request/response client yet.
- Full schema client generation remains a later hardening task.
