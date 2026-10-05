#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OUT="${1:-/tmp/ai-lawyer-kz.tar.gz}"

cd "$ROOT_DIR"
bash scripts/deploy/check-server.sh
npm run build
git archive --format=tar.gz -o "$OUT" HEAD
echo "$OUT"
