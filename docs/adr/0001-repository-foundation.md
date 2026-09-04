# ADR 0001: Repository Foundation

## Status

Accepted

## Context

The repository initially contained only the release master prompt and design PNG files. The target architecture requires a monorepo with Flutter mobile, Next.js admin, NestJS API, FastAPI AI service, contracts, infrastructure, and release documentation.

## Decision

Create the target folder structure with minimal runnable source entrypoints and shared design tokens derived from the provided light and dark design references.

## Consequences

- Future slices can be implemented vertically against stable folders.
- Full verification is blocked until Flutter, Docker, and package dependencies are installed.
