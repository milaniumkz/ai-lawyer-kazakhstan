#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${DB_NAME:-ai_lawyer_kz}"
BACKUP_DIR="${BACKUP_DIR:-/opt/ai-lawyer-kz/backups/postgres}"
KEEP_DAYS="${KEEP_DAYS:-7}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
sudo -u postgres pg_dump -Fc "$DB_NAME" > "$BACKUP_DIR/${DB_NAME}_${STAMP}.dump"
find "$BACKUP_DIR" -type f -name "${DB_NAME}_*.dump" -mtime +"$KEEP_DAYS" -delete
ls -lh "$BACKUP_DIR/${DB_NAME}_${STAMP}.dump"
