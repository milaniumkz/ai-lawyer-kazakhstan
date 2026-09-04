# ADR 0006: Local Template Engine Stub

## Status

Accepted

## Context

Legally approved templates are not available yet. The system must support document drafting without claiming legal approval.

## Decision

Implement a local versioned template engine with one dосудебная претензия template in `expert_review` status. Generated documents are marked `draft_requires_user_confirmation`, unresolved placeholders are rejected, and missing required fields fail fast.

## Consequences

- Document drafting is testable in local mode.
- Generated documents are not final legal documents.
- Human approval and expanded template catalog remain required before release.
