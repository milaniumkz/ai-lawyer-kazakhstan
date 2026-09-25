#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:-v0.1.0-rc.2}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OUT_DIR="$ROOT_DIR/dist/release/$VERSION"
ARCHIVE="$ROOT_DIR/dist/release/ai-lawyer-kz-$VERSION-release-bundle.tar.gz"

cd "$ROOT_DIR"
rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR/docs" "$OUT_DIR/contracts" "$OUT_DIR/mobile" "$OUT_DIR/source"

cp docs/project/RC_RELEASE_MANIFEST.md "$OUT_DIR/docs/"
cp docs/project/RELEASE_NOTES.md "$OUT_DIR/docs/"
cp docs/project/RELEASE_CHECKLIST.md "$OUT_DIR/docs/"
cp docs/project/RC_ACCEPTANCE_MATRIX.md "$OUT_DIR/docs/"
cp docs/project/TEST_EVIDENCE.md "$OUT_DIR/docs/"
cp docs/project/EXTERNAL_BLOCKERS.md "$OUT_DIR/docs/"
cp docs/project/RELEASE_BLOCKERS_REPORT.md "$OUT_DIR/docs/"
cp docs/project/SERVER_DEPLOYMENT.md "$OUT_DIR/docs/"
cp docs/project/ARTIFACT_CHECKSUMS.md "$OUT_DIR/docs/"
cp packages/contracts/openapi.yaml "$OUT_DIR/contracts/"
cp apps/mobile/build/app/outputs/flutter-apk/app-release.apk "$OUT_DIR/mobile/"
if [[ -f apps/mobile/build/app/outputs/bundle/release/app-release.aab ]]; then
  cp apps/mobile/build/app/outputs/bundle/release/app-release.aab "$OUT_DIR/mobile/"
fi

git archive --format=tar.gz -o "$OUT_DIR/source/ai-lawyer-kz-$VERSION-source.tar.gz" "$VERSION"
find "$OUT_DIR" -type f ! -name SHA256SUMS -print0 | sort -z | xargs -0 shasum -a 256 > "$OUT_DIR/SHA256SUMS"
tar -C "$OUT_DIR/.." -czf "$ARCHIVE" "$VERSION"
shasum -a 256 "$ARCHIVE"
