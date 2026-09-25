# QA Release Bundle

Current RC: `v0.1.0-rc.12`.

Build locally:

```bash
npm run release:bundle -- v0.1.0-rc.12
```

Output:

- `dist/release/v0.1.0-rc.12/`
- `dist/release/ai-lawyer-kz-v0.1.0-rc.12-release-bundle.tar.gz`, SHA-256 `844f029a648abaec6f042b42ded7e227fff8e915ac19a71689f0bbc298e011f7`
- `dist/release/v0.1.0-rc.12/SHA256SUMS`

Bundle contents:

- RC manifest, release notes, checklist, acceptance matrix, blockers and test evidence.
- OpenAPI contract.
- Android release APK.
- Android Play-prep AAB, debug-signed until production upload keystore is provided.
- Source archive from tag `v0.1.0-rc.12`.

Before handing to QA:

```bash
npm run release-check:local
npm run release-check:server
npm run release:bundle -- v0.1.0-rc.12
```
