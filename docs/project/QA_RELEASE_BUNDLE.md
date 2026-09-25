# QA Release Bundle

Current RC: `v0.1.0-rc.16`.

Build locally:

```bash
npm run release:bundle -- v0.1.0-rc.16
```

Output:

- `dist/release/v0.1.0-rc.16/`
- `dist/release/ai-lawyer-kz-v0.1.0-rc.16-release-bundle.tar.gz`, SHA-256 `e546fb98f96658405f1ab940b49f4bbc032bd50b866badcd0f6ab2c32279eb24`
- `dist/release/v0.1.0-rc.16/SHA256SUMS`

Bundle contents:

- RC manifest, release notes, checklist, acceptance matrix, blockers and test evidence.
- OpenAPI contract.
- Android release APK.
- Android Play-prep AAB, debug-signed until production upload keystore is provided.
- Source archive from tag `v0.1.0-rc.16`.

Before handing to QA:

```bash
npm run release-check:local
npm run release-check:server
npm run release:bundle -- v0.1.0-rc.16
```
