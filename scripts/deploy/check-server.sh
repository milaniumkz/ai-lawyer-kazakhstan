#!/usr/bin/env bash
set -euo pipefail

# Server deployment includes web, admin, API and AI. Mobile builds are checked
# separately by CI and are not installed by server-install.sh.
npm run lint
npm run typecheck
npm test
npm run test:contract
npm run test:migrations
npm run test:design-source
npm run test:design-pixel
npm run test:web-pixel-diff
npm run test:admin-ui
npm run test:web-ui
npm run test:web-visual
npm run test:security
npm run test:audit:runtime
npm run test:ai
if command -v docker >/dev/null 2>&1; then
  npm run docker:config >/dev/null
fi
