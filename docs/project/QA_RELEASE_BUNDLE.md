# QA Release Bundle

Current RC: `v0.1.0-rc.15`.

Build locally:

```bash
npm run release:bundle -- v0.1.0-rc.15
```

Output:

- `dist/release/v0.1.0-rc.15/`
- `dist/release/ai-lawyer-kz-v0.1.0-rc.15-release-bundle.tar.gz`, SHA-256 `4f58bb80f4c2b737008a6c5db5d8a26ac2538446b2096fca58fce7c7e8424d8a`
- `dist/release/v0.1.0-rc.15/SHA256SUMS`

Bundle contents:

- RC manifest, release notes, checklist, acceptance matrix, blockers and test evidence.
- OpenAPI contract.
- Android release APK.
- Android Play-prep AAB, debug-signed until production upload keystore is provided.
- Source archive from tag `v0.1.0-rc.15`.

Before handing to QA:

```bash
npm run release-check:local
npm run release-check:server
npm run release:bundle -- v0.1.0-rc.15
```
