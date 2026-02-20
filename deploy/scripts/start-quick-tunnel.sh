#!/usr/bin/env bash
set -euo pipefail

TUNNEL_TARGET="${TUNNEL_TARGET:-http://127.0.0.1:80}"
LOG_FILE="${LOG_FILE:-/var/log/cloudflared-tumbas.log}"

install_cloudflared() {
  if command -v cloudflared >/dev/null 2>&1; then
    return
  fi

  ARCH="$(uname -m)"
  if [ "$ARCH" = "x86_64" ]; then
    URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64"
  elif [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
    URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64"
  else
    echo "Unsupported arch: $ARCH"
    exit 1
  fi

  curl -L "$URL" -o /usr/local/bin/cloudflared
  chmod +x /usr/local/bin/cloudflared
}

install_cloudflared

pkill -f "cloudflared tunnel --url" || true
nohup cloudflared tunnel --url "$TUNNEL_TARGET" > "$LOG_FILE" 2>&1 &

sleep 3

URL_LINE="$(grep -Eo 'https://[-a-zA-Z0-9]+\.trycloudflare\.com' "$LOG_FILE" | head -n 1 || true)"

if [ -n "$URL_LINE" ]; then
  echo "Quick Tunnel URL: $URL_LINE"
else
  echo "Tunnel started, but URL not found yet. Check log: $LOG_FILE"
fi
