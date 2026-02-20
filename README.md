# Tumbas Market

Monorepo sederhana untuk marketplace:
- frontend: Next.js (`/`)
- backend: NestJS + Prisma (`/backend`)

## Development

1) Setup backend env

```bash
cp backend/.env.example backend/.env
```

2) Setup frontend env

```bash
cp .env.example .env.local
```

3) Install dependencies

```bash
npm install
cd backend && npm install
```

4) Run backend

```bash
cd backend
npm run start:dev
```

5) Run frontend (port 3000)

```bash
npm run dev
```

Catatan:
- Script frontend dev memakai `--webpack` untuk menghindari issue lock/workspace Turbopack pada beberapa environment.
- Frontend akan timeout request API setelah 15 detik dengan pesan error yang jelas.

## Build Check

```bash
# frontend
npm run build

# backend
cd backend
npm run build
```

## Docker

`backend/Dockerfile` sudah multi-stage build dan menjalankan:

```bash
npx prisma migrate deploy && node dist/main.js
```

Jalankan dengan compose (jika Docker terpasang):

```bash
docker compose up --build
```

## Remote Deployment (Coolify + Nginx + Cloudflare Quick Tunnel)

Panduan dan script siap pakai ada di:

- `deploy/REMOTE_SETUP.md`
- `deploy/scripts/bootstrap-coolify.sh`
- `deploy/scripts/setup-nginx-tumbas.sh`
- `deploy/scripts/start-quick-tunnel.sh`

Use case:
- install Coolify di server,
- route app lewat Nginx (`/` frontend, `/api` backend),
- expose test URL publik via `*.trycloudflare.com` tanpa domain dulu.
