#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/ai-lawyer-kz}"

cat >/etc/systemd/system/ai-lawyer-postgres-backup.service <<UNIT
[Unit]
Description=AI Lawyer KZ PostgreSQL backup

[Service]
Type=oneshot
ExecStart=$APP_ROOT/app/scripts/deploy/server-backup-postgres.sh
UNIT

cat >/etc/systemd/system/ai-lawyer-postgres-backup.timer <<'UNIT'
[Unit]
Description=Daily AI Lawyer KZ PostgreSQL backup

[Timer]
OnCalendar=*-*-* 02:15:00 UTC
Persistent=true

[Install]
WantedBy=timers.target
UNIT

systemctl daemon-reload
systemctl enable --now ai-lawyer-postgres-backup.timer
systemctl list-timers ai-lawyer-postgres-backup.timer --no-pager
