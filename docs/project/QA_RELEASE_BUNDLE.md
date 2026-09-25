# QA Release Bundle

Current RC: `v0.1.0-rc.14`.

Build locally:

```bash
npm run release:bundle -- v0.1.0-rc.14
```

Output:

- `dist/release/v0.1.0-rc.14/`
- `dist/release/ai-lawyer-kz-v0.1.0-rc.14-release-bundle.tar.gz`, SHA-256 `5041b675c3825b171ecc889282f556299ca459b2540a19ebc92347040a1ffbab`
- `dist/release/v0.1.0-rc.14/SHA256SUMS`

Bundle contents:

- RC manifest, release notes, checklist, acceptance matrix, blockers and test evidence.
- OpenAPI contract.
- Android release APK.
- Android Play-prep AAB, debug-signed until production upload keystore is provided.
- Source archive from tag `v0.1.0-rc.14`.

Before handing to QA:

```bash
npm run release-check:local
npm run release-check:server
npm run release:bundle -- v0.1.0-rc.14
```
