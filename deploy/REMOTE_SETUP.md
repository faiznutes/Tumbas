# Remote Server Setup (Coolify + Nginx + Cloudflare Quick Tunnel)

Dokumen ini disiapkan supaya kamu bisa eksekusi full dari PowerShell lokal ke server `root@192.168.1.105`.

## 1) SSH dari PowerShell

```powershell
ssh root@192.168.1.105
```

## 2) Install Docker + Coolify

Jalankan di server:

```bash
cd /root
curl -fsSL https://raw.githubusercontent.com/coollabsio/coolify/main/scripts/install.sh | bash
```

Jika script upstream berubah / gagal, pakai fallback script repo ini:

```bash
chmod +x /root/tumbas-market/deploy/scripts/bootstrap-coolify.sh
/root/tumbas-market/deploy/scripts/bootstrap-coolify.sh
```

Panel Coolify default: `http://SERVER_IP:8000`

## 3) Setup Nginx reverse proxy untuk Tumbas

Script ini akan:
- install Nginx,
- create site config,
- route `/` -> frontend, `/api` -> backend,
- reload Nginx.

```bash
chmod +x /root/tumbas-market/deploy/scripts/setup-nginx-tumbas.sh
FRONTEND_UPSTREAM=http://127.0.0.1:3000 BACKEND_UPSTREAM=http://127.0.0.1:3001 /root/tumbas-market/deploy/scripts/setup-nginx-tumbas.sh
```

Catatan:
- Jika service frontend/backend dijalankan dari Coolify dengan port berbeda, ubah `FRONTEND_UPSTREAM` dan `BACKEND_UPSTREAM`.

## 4) Cloudflare Quick Tunnel (tanpa domain)

Script ini akan:
- install `cloudflared` jika belum ada,
- start tunnel ke Nginx (`http://127.0.0.1:80`),
- print URL `*.trycloudflare.com`.

```bash
chmod +x /root/tumbas-market/deploy/scripts/start-quick-tunnel.sh
TUNNEL_TARGET=http://127.0.0.1:80 /root/tumbas-market/deploy/scripts/start-quick-tunnel.sh
```

Log tunnel:
- `/var/log/cloudflared-tumbas.log`

## 5) Health Check

```bash
curl -I http://127.0.0.1/
curl -I http://127.0.0.1/api
```

Kalau login admin belum jalan, cek:
- backend env (`DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`),
- database sudah running,
- migrasi backend sudah apply.

## 6) Deployment checklist Tumbas

- [ ] Coolify panel bisa dibuka
- [ ] Frontend service up
- [ ] Backend service up
- [ ] Nginx route `/` dan `/api` normal
- [ ] Quick tunnel URL aktif
- [ ] Admin login sukses
- [ ] Submit contact -> muncul di admin messages
