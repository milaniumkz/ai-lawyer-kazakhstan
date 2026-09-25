# QA Release Bundle

Current RC: `v0.1.0-rc.17`.

Build locally:

```bash
npm run release:bundle -- v0.1.0-rc.17
```

Output:

- `dist/release/v0.1.0-rc.17/`
- `dist/release/ai-lawyer-kz-v0.1.0-rc.17-release-bundle.tar.gz`, SHA-256 pending build
- `dist/release/v0.1.0-rc.17/SHA256SUMS`

Bundle contents:

- RC manifest, release notes, checklist, acceptance matrix, blockers and test evidence.
- OpenAPI contract.
- Android release APK.
- Android Play-prep AAB, debug-signed until production upload keystore is provided.
- Source archive from tag `v0.1.0-rc.17`.

Before handing to QA:

```bash
npm run release-check:local
npm run release-check:server
npm run release:bundle -- v0.1.0-rc.17
```
