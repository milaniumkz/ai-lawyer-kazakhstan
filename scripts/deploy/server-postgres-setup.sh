#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/ai-lawyer-kz}"
DB_NAME="${DB_NAME:-ai_lawyer_kz}"
DB_USER="${DB_USER:-ai_lawyer_app}"
DB_PASS_FILE="${DB_PASS_FILE:-/root/.ai_lawyer_db_password}"
API_ENV_FILE="${API_ENV_FILE:-/etc/ai-lawyer-api.env}"

if ! command -v psql >/dev/null 2>&1 || ! dpkg -s postgresql-16-pgvector >/dev/null 2>&1; then
  apt-get update
  apt-get install -y postgresql postgresql-contrib postgresql-16-pgvector openssl
fi
systemctl enable --now postgresql

if [ ! -f "$DB_PASS_FILE" ]; then
  openssl rand -hex 32 > "$DB_PASS_FILE"
  chmod 600 "$DB_PASS_FILE"
fi
DB_PASS="$(cat "$DB_PASS_FILE")"

sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASS}';
  ELSE
    ALTER ROLE ${DB_USER} WITH PASSWORD '${DB_PASS}';
  END IF;
END
\$\$;
SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\gexec
SQL

if [ "$(sudo -u postgres psql -d "$DB_NAME" -tAc "SELECT to_regclass('public.users') IS NOT NULL;")" != "t" ]; then
  sudo -u postgres psql -d "$DB_NAME" -v ON_ERROR_STOP=1 \
    -f "$APP_ROOT/app/infra/db/migrations/0001_initial_schema.sql" \
    -f "$APP_ROOT/app/infra/db/migrations/0002_case_idempotency_keys.sql" \
    -f "$APP_ROOT/app/infra/db/migrations/0003_upload_sessions.sql" \
    -f "$APP_ROOT/app/infra/db/migrations/0004_billing_subscriptions_providers.sql"
fi

sudo -u postgres psql -d "$DB_NAME" -v ON_ERROR_STOP=1 \
  -f "$APP_ROOT/app/infra/db/seeds/0001_templates.sql"

sudo -u postgres psql -d "$DB_NAME" -v ON_ERROR_STOP=1 <<SQL
GRANT USAGE, CREATE ON SCHEMA public TO ${DB_USER};
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${DB_USER};
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO ${DB_USER};
SQL

cat > "$API_ENV_FILE" <<ENV
NODE_ENV=production
APP_ENV=staging
PORT=3001
HOST=127.0.0.1
PERSISTENCE_MODE=postgres
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@127.0.0.1:5432/${DB_NAME}
ENV
chmod 600 "$API_ENV_FILE"

systemctl daemon-reload
systemctl restart ai-lawyer-api
bash "$APP_ROOT/app/scripts/deploy/server-health-check.sh"
sudo -u postgres psql -d "$DB_NAME" -tAc "SELECT count(*) FROM templates;"
