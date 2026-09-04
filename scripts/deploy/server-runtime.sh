#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/ai-lawyer-kz}"
API_ENV_FILE="${API_ENV_FILE:-/etc/ai-lawyer-api.env}"

if [ ! -f "$API_ENV_FILE" ]; then
  cat > "$API_ENV_FILE" <<'ENV'
NODE_ENV=production
APP_ENV=staging
PORT=3001
PERSISTENCE_MODE=local
ENV
  chmod 600 "$API_ENV_FILE"
fi

cat >/etc/systemd/system/ai-lawyer-web.service <<UNIT
[Unit]
Description=AI Lawyer KZ Web
After=network.target

[Service]
Type=simple
WorkingDirectory=$APP_ROOT/app/apps/web
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/npm run start -- --hostname 127.0.0.1
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT

cat >/etc/systemd/system/ai-lawyer-admin.service <<UNIT
[Unit]
Description=AI Lawyer KZ Admin
After=network.target

[Service]
Type=simple
WorkingDirectory=$APP_ROOT/app/apps/admin
Environment=NODE_ENV=production
Environment=PORT=3002
ExecStart=/usr/bin/npm run start -- --hostname 127.0.0.1
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT

cat >/etc/systemd/system/ai-lawyer-api.service <<UNIT
[Unit]
Description=AI Lawyer KZ API
After=network.target

[Service]
Type=simple
EnvironmentFile=$API_ENV_FILE
WorkingDirectory=$APP_ROOT/app/services/api
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT

cat >/etc/systemd/system/ai-lawyer-ai.service <<UNIT
[Unit]
Description=AI Lawyer KZ AI Service
After=network.target

[Service]
Type=simple
WorkingDirectory=$APP_ROOT/app/services/ai/app
Environment=PYTHONPATH=$APP_ROOT/app/services/ai/app
ExecStart=$APP_ROOT/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT

mkdir -p /etc/ai-lawyer-kz/tls
if [ ! -f /etc/ai-lawyer-kz/tls/selfsigned.crt ] || [ ! -f /etc/ai-lawyer-kz/tls/selfsigned.key ]; then
  openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
    -keyout /etc/ai-lawyer-kz/tls/selfsigned.key \
    -out /etc/ai-lawyer-kz/tls/selfsigned.crt \
    -subj "/CN=89.207.250.217" \
    -addext "subjectAltName=IP:89.207.250.217"
  chmod 600 /etc/ai-lawyer-kz/tls/selfsigned.key
fi

cat >/etc/nginx/sites-available/ai-lawyer-kz <<'NGINX'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    client_max_body_size 25m;

    location /admin {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/v1/ {
        proxy_pass http://127.0.0.1:3001/api/v1/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /ai/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name _;

    ssl_certificate /etc/ai-lawyer-kz/tls/selfsigned.crt;
    ssl_certificate_key /etc/ai-lawyer-kz/tls/selfsigned.key;
    client_max_body_size 25m;

    location /admin {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/v1/ {
        proxy_pass http://127.0.0.1:3001/api/v1/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /ai/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX

rm -f /etc/nginx/sites-enabled/default
ln -sfn /etc/nginx/sites-available/ai-lawyer-kz /etc/nginx/sites-enabled/ai-lawyer-kz
nginx -t

systemctl daemon-reload
systemctl enable --now ai-lawyer-web ai-lawyer-admin ai-lawyer-api ai-lawyer-ai nginx
systemctl restart ai-lawyer-web ai-lawyer-admin ai-lawyer-api ai-lawyer-ai nginx
bash "$APP_ROOT/app/scripts/deploy/server-health-check.sh"
