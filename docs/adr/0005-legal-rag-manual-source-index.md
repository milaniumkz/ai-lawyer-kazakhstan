# ADR 0005: Legal RAG Manual Source Index

## Status

Accepted

## Context

Official API access for KZ legal source ingestion is not documented in the repository. The system must not invent norms, scrape without permission or use model memory as a legal source.

## Decision

Implement a manual/stub official-source index with allowlisted official KZ domains, source version metadata, checksums and citation validation. Return `insufficient_authoritative_sources` when no confirmed active source is available.

## Consequences

- Legal guardrails are testable now.
- Production ingestion remains blocked until official access/permissions are provided.
- The product can proceed with safe refusal and human-review flows without fake integrations.
