#!/usr/bin/env bash
set -euo pipefail

echo "[1/4] Checking Docker..."
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi

systemctl enable --now docker
docker version >/dev/null

echo "[2/4] Installing Coolify..."
if curl -fsSL https://raw.githubusercontent.com/coollabsio/coolify/main/scripts/install.sh | bash; then
  echo "Coolify installed via upstream installer."
else
  echo "Upstream installer failed. Trying official CDN installer..."
  curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
fi

echo "[3/4] Verifying Coolify containers..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo "[4/4] Done"
echo "Open Coolify panel: http://$(hostname -I | awk '{print $1}'):8000"
