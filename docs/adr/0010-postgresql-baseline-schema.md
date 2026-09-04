# ADR 0010: PostgreSQL Baseline Schema

## Status

Accepted

## Context

The first implementation slices used in-memory local services. Release readiness requires an explicit database schema before replacing services with persistent repositories.

## Decision

Add `infra/db/migrations/0001_initial_schema.sql` covering identity, sessions, profiles, cases, messages, transcripts, files, evidence folders, legal source fragments with pgvector, templates, generated documents, AI usage and audit logs.

## Consequences

- Persistence has a concrete migration baseline.
- Runtime services still use in-memory storage until repository implementation slices are added.
- Docker/PostgreSQL execution remains blocked locally because Docker is not installed.
