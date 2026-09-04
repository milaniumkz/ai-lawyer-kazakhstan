# ADR 0009: Release Packaging Scaffold

## Status

Accepted

## Context

The Flutter app initially had no Android/iOS platform projects, so mobile release validation could not start.

## Decision

Generate Flutter Android/iOS scaffolding, set the Android package id to `kz.ailawyer.mobile`, set iOS display name to `AI Юрист`, and validate Android debug/release plus iOS debug no-codesign builds.

## Consequences

- Mobile packaging has a concrete baseline.
- Android release currently uses temporary debug signing and is not store-ready.
- iOS App Store/TestFlight export remains blocked by missing distribution credentials.
