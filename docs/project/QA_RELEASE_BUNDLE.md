# QA Release Bundle

Current RC: `v0.1.0-rc.3`.

Build locally:

```bash
npm run release:bundle
```

Output:

- `dist/release/v0.1.0-rc.3/`
- `dist/release/ai-lawyer-kz-v0.1.0-rc.3-release-bundle.tar.gz`
- `dist/release/v0.1.0-rc.3/SHA256SUMS`

Bundle contents:

- RC manifest, release notes, checklist, acceptance matrix, blockers and test evidence.
- OpenAPI contract.
- Android release APK.
- Source archive from tag `v0.1.0-rc.3`.

Before handing to QA:

```bash
npm run release-check:local
npm run release-check:server
npm run release:bundle
```
