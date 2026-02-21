# Runbook Midtrans Webhook & Payment Sync

## 1) Midtrans Sandbox Configuration Checklist

- Dashboard mode: **Sandbox**
- Server key: gunakan key `SB-Mid-server-*`
- Client key: gunakan key `SB-Mid-client-*`
- Payment Notification URL: `https://tumbas.faiznute.site/api/webhook/midtrans`
- HTTP method: `POST`
- Jangan tambahkan auth custom/header custom selain bawaan Midtrans

## 2) Webhook Route & Auth Behavior (Expected)

- Route: `POST /api/webhook/midtrans`
- Public endpoint untuk provider, **tanpa JWT**
- Signature wajib valid:
  - diterima dari header `x-signature-key`, atau
  - dari body `signature_key`
- Invalid signature -> `401 Unauthorized`
- Signature valid tapi order tidak ditemukan -> response warning (`success: false, message: "Order not found"`) dan log tetap tercatat

## 3) Fallback Sync Saat Webhook Terlambat

Endpoint fallback:

- `POST /api/orders/:id/sync-payment?token=<public_order_token>`

Auth fallback:

- menggunakan HMAC public token (bukan JWT)
- tanpa token -> `400`
- token invalid -> `401`
- token valid -> sinkron status dari Midtrans lalu return public order terbaru

Halaman yang otomatis trigger fallback:

- `/payment/pending`
- `/success`
- `/orders`

## 4) Monitoring SOP (Operasional)

Gunakan monitor:

- `GET /api/webhook/midtrans/monitor?minutes=60`
- auth: `SUPER_ADMIN` / `ADMIN`

Panel admin tersedia di:

- `/admin/webhooks`

Ambang perhatian (rekomendasi):

- `invalidSignature > 0` per 60 menit -> cek konfigurasi Midtrans callback dan key
- `failed > 0` per 60 menit -> cek backend logs + retry root cause
- `warning` naik tajam -> cek mismatch `order_id` di request

## 5) Incident Response: "Midtrans sukses tapi order masih PENDING"

1. Cek order di DB (`payment_status`, `midtrans_order_id`)
2. Cek `/admin/webhooks` untuk entri webhook terbaru (valid/invalid/failed)
3. Panggil fallback sync (`POST /api/orders/:id/sync-payment?token=...`)
4. Jika sync mengubah status ke `PAID`, berarti webhook telat/tidak terkirim
5. Jika sync tetap `PENDING`, verifikasi status transaksi di dashboard Midtrans
6. Jika Midtrans sudah settlement tapi sync tidak update, cek `MIDTRANS_SERVER_KEY` aktif dan environment mode

## 6) Security Hardening Checklist (Production)

- `JWT_SECRET` bukan placeholder
- `ORDER_PUBLIC_SECRET` terpisah dari JWT secret
- `DATABASE_URL` tidak gunakan password default
- Mode Midtrans sesuai key:
  - sandbox key (`SB-*`) <-> `MIDTRANS_IS_PRODUCTION=false`
  - production key (non `SB-*`) <-> `MIDTRANS_IS_PRODUCTION=true`

## 7) Secret Rotation Notes

- Jika melakukan rotasi `ORDER_PUBLIC_SECRET`, set sementara `ORDER_PUBLIC_SECRET_PREVIOUS` untuk kompatibilitas link order lama.
- Setelah masa transisi selesai (mis. 7-14 hari), hapus `ORDER_PUBLIC_SECRET_PREVIOUS` agar hanya secret baru yang aktif.
