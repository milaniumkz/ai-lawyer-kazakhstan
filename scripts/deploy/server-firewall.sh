#!/usr/bin/env bash
set -euo pipefail

apt-get update
apt-get install -y ufw
ufw allow OpenSSH
ufw allow 80/tcp
ufw --force enable
ufw status verbose
