#!/usr/bin/env bash
set -euo pipefail
cd /workspace/ai-lawyer-kazakhstan
npm ci --no-fund --cache /workspace/.npm-cache
python3 -m venv .venv
.venv/bin/pip install --cache-dir /workspace/.pip-cache -e services/ai
.venv/bin/pip check
if [ ! -x /workspace/flutter-sdk/bin/flutter ]; then
  git clone --branch 3.47.6 --depth 1 https://github.com/flutter/flutter.git /workspace/flutter-sdk
fi
node scripts/mobile/flutter.mjs pub get --directory apps/mobile
npm run build
