#!/usr/bin/env bash
set -euo pipefail

ARCHIVE="${1:-/opt/ai-lawyer-kz.tar.gz}"
APP_ROOT="${APP_ROOT:-/opt/ai-lawyer-kz}"

apt-get update
apt-get install -y ca-certificates curl gnupg nginx openssl python3-venv python3-pip build-essential

if ! command -v node >/dev/null 2>&1 || ! node --version | grep -q '^v24'; then
  curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
  apt-get install -y nodejs
fi

mkdir -p "$APP_ROOT"
rm -rf "$APP_ROOT/app.new"
mkdir -p "$APP_ROOT/app.new"
tar -xzf "$ARCHIVE" -C "$APP_ROOT/app.new"

cd "$APP_ROOT/app.new"
npm ci
npm run build

python3 -m venv "$APP_ROOT/venv"
"$APP_ROOT/venv/bin/pip" install --no-cache-dir fastapi uvicorn pydantic

if [ -d "$APP_ROOT/app" ]; then
  rm -rf "$APP_ROOT/app.prev"
  mv "$APP_ROOT/app" "$APP_ROOT/app.prev"
fi
mv "$APP_ROOT/app.new" "$APP_ROOT/app"

bash "$APP_ROOT/app/scripts/deploy/server-runtime.sh"
