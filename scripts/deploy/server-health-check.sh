#!/usr/bin/env bash
set -euo pipefail

sleep "${HEALTH_DELAY_SECONDS:-8}"
systemctl is-active ai-lawyer-web ai-lawyer-admin ai-lawyer-api ai-lawyer-ai nginx >/dev/null
curl -fsS http://127.0.0.1:3001/api/v1/health >/dev/null
curl -fsS http://127.0.0.1:8000/health >/dev/null
curl -fsSI http://127.0.0.1/ >/dev/null
curl -fsSIL --max-redirs 5 http://127.0.0.1/admin >/dev/null
curl -fsS http://127.0.0.1/api/v1/health >/dev/null
curl -fsS http://127.0.0.1/ai/health >/dev/null
echo "server health ok"
