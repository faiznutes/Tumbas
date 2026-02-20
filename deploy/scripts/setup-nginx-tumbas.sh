#!/usr/bin/env bash
set -euo pipefail

FRONTEND_UPSTREAM="${FRONTEND_UPSTREAM:-http://127.0.0.1:3000}"
BACKEND_UPSTREAM="${BACKEND_UPSTREAM:-http://127.0.0.1:3001}"
SITE_CONF="/etc/nginx/sites-available/tumbas"

echo "Installing Nginx if needed..."
if ! command -v nginx >/dev/null 2>&1; then
  apt-get update -y
  apt-get install -y nginx
fi

cat > "$SITE_CONF" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name _;

    client_max_body_size 20m;

    location /api/ {
        proxy_pass ${BACKEND_UPSTREAM}/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
    }

    location / {
        proxy_pass ${FRONTEND_UPSTREAM}/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
    }
}
EOF

ln -sf "$SITE_CONF" /etc/nginx/sites-enabled/tumbas
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl enable --now nginx
systemctl reload nginx

echo "Nginx configured."
echo "Frontend upstream: ${FRONTEND_UPSTREAM}"
echo "Backend upstream:  ${BACKEND_UPSTREAM}"
