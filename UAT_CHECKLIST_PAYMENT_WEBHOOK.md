# UAT Checklist: Payment & Webhook (Sandbox)

## Scope

- Checkout produk tunggal
- Checkout cart multi-item
- Midtrans Snap popup
- Webhook update status pembayaran
- Fallback sync status pembayaran
- Monitoring admin webhook

## Preconditions

- Midtrans mode: Sandbox
- Notification URL: `https://tumbas.faiznute.site/api/webhook/midtrans`
- Admin account aktif (akses `/admin/webhooks`, `/admin/orders`)

## Test Case 1: Single Item Checkout -> PAID

1. Buka `/checkout/iphone-promax`
2. Isi data customer lengkap + pilih kota/kelurahan
3. Pilih kurir dan klik `Bayar Sekarang`
4. Selesaikan pembayaran sandbox di Snap
5. Verifikasi:
   - Tidak ada client-side exception di browser console
   - Redirect ke `/success` atau `/payment/pending` lalu status berubah ke `PAID`
   - `/orders` menampilkan status `PAID`
   - `/admin/orders` menampilkan order dengan status `PAID`

## Test Case 2: Multi-item Cart Checkout -> PAID

1. Tambahkan >=2 produk ke cart
2. Buka `/checkout/cart`
3. Isi data customer + shipping
4. Selesaikan pembayaran di Snap
5. Verifikasi:
   - Detail item multi-item tampil di `/success` dan `/orders`
   - Admin detail order menampilkan `orderItems` lengkap
   - Receipt TXT/PDF menampilkan semua item

## Test Case 3: Webhook Signature Validation

1. Kirim request dummy tanpa signature valid ke `/api/webhook/midtrans`
2. Verifikasi response `401`
3. Kirim request signed valid (header atau body `signature_key`)
4. Verifikasi log webhook tercatat `is_valid=true`

## Test Case 4: Fallback Sync (Webhook Delay Simulation)

1. Gunakan order `PENDING` dengan `midtrans_order_id` valid
2. Panggil `POST /api/orders/:id/sync-payment?token=...`
3. Verifikasi:
   - Tanpa token -> `400`
   - Token invalid -> `401`
   - Token valid -> status order update sesuai status Midtrans

## Test Case 5: Monitoring & Incident Drill

1. Buka `/admin/webhooks`
2. Verifikasi metric summary tampil
3. Jika ada `invalid_signature` atau `failed`, banner health menampilkan warning/critical
4. Export CSV dan pastikan issue entries sesuai filter

## Exit Criteria

- 100% testcase lulus
- Tidak ada error kritikal di console/frontend/backend log
- Tidak ada order yang stuck `PENDING` padahal Midtrans sudah settlement (atau bisa dipulihkan via sync fallback)
