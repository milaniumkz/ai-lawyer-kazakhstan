# QA Release Bundle

Current RC: `v0.1.0-rc.18`.

Build locally:

```bash
npm run release:bundle -- v0.1.0-rc.18
```

Output:

- `dist/release/v0.1.0-rc.18/`
- `dist/release/ai-lawyer-kz-v0.1.0-rc.18-release-bundle.tar.gz`, SHA-256 `1348099227c559452ac234e50aa72d50e229b38d2e3e7173e26abb378e48e1e7`
- `dist/release/v0.1.0-rc.18/SHA256SUMS`

Bundle contents:

- RC manifest, release notes, checklist, acceptance matrix, blockers and test evidence.
- Machine-readable release blocker report rendered as Markdown.
- OpenAPI contract.
- Android release APK.
- Android Play-prep AAB, debug-signed until production upload keystore is provided.
- Source archive from tag `v0.1.0-rc.18`.

Before handing to QA:

```bash
npm run release-check:local
npm run release-check:server
npm run release:bundle -- v0.1.0-rc.18
```
