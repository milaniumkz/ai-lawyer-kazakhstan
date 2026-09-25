# QA Release Bundle

Current RC: `v0.1.0-rc.13`.

Build locally:

```bash
npm run release:bundle -- v0.1.0-rc.13
```

Output:

- `dist/release/v0.1.0-rc.13/`
- `dist/release/ai-lawyer-kz-v0.1.0-rc.13-release-bundle.tar.gz`, SHA-256 `b84d0d15d5970e9c1fc06a19b51fc2be14eb0e20d721b0682de4f7af7359d1a3`
- `dist/release/v0.1.0-rc.13/SHA256SUMS`

Bundle contents:

- RC manifest, release notes, checklist, acceptance matrix, blockers and test evidence.
- OpenAPI contract.
- Android release APK.
- Android Play-prep AAB, debug-signed until production upload keystore is provided.
- Source archive from tag `v0.1.0-rc.13`.

Before handing to QA:

```bash
npm run release-check:local
npm run release-check:server
npm run release:bundle -- v0.1.0-rc.13
```
