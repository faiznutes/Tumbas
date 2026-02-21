# Task Progress

Dokumen ini dipakai untuk tracking progres implementasi.

## Legend
- [x] Done
- [ ] Pending
- [~] In Progress

## Current Sprint

### 1) Stabilitas Frontend Dev
- [x] Investigasi issue `localhost:3000` loading terus
- [x] Identifikasi error resolver Tailwind pada mode dev
- [x] Ubah script dev ke `next dev --webpack`
- [x] Verifikasi frontend bisa startup normal di port 3000

### 2) Hardening Auth & Admin Access
- [x] Simpan auth token ke cookie untuk proteksi server-side
- [x] Tambah proxy guard untuk route `/admin/*`
- [x] Redirect unauthorized user ke `/admin/login?next=...`
- [x] Redirect user login dari `/admin/login` ke dashboard
- [x] Role-based gate di proxy:
  - [x] `/admin/users` => `SUPER_ADMIN`
  - [x] `/admin/settings` => `SUPER_ADMIN | ADMIN | MANAGER`
- [x] Tampilkan notifikasi akses ditolak via toast di dashboard

### 3) Hardening Payment & Order Visibility
- [x] Implement Midtrans Snap trigger di checkout
- [x] Tambah timeout request API (anti loading tanpa batas)
- [x] Proteksi endpoint order detail internal dengan JWT
- [x] Tambah endpoint order public minimal data
- [x] Wajibkan `token` pada endpoint order public
- [x] Tambah polling status pembayaran di halaman pending

### 4) Backend Security & Validation
- [x] Aktifkan throttling global (`APP_GUARD`)
- [x] Perbaiki kontrak auth response (`accessToken` kompatibel)
- [x] Ubah default role register menjadi `STAFF`
- [x] Perketat DTO validation di settings/users
- [x] Tambah role guard di endpoint update settings

### 5) Deploy Readiness
- [x] Refactor backend Dockerfile ke multi-stage build
- [x] Jalankan `prisma migrate deploy` saat container startup
- [ ] Validasi docker compose end-to-end di environment dengan Docker (blocked: Docker CLI belum terpasang)

## Next Tasks
- [x] Integrasi RajaOngkir Starter (`jne`, `jnt`, `sicepat`) untuk kalkulasi ongkir realtime di checkout
- [x] Sinkronisasi ongkir ke Midtrans (`item_details` + `gross_amount`) agar total pembayaran konsisten
- [x] Aktifkan keranjang real: add-to-cart dari homepage/shop/detail + badge navbar realtime
- [x] Hilangkan pintasan admin `T` dari navbar user/public
- [x] Refactor checkout dari single-product ke multi-item cart checkout
- [x] Implement variant matrix 2 atribut (opsi x opsi), stok per kombinasi, dan berat per varian (admin + user)
- [x] Tambah data shipping terstruktur di tabel order (courier/service/etd/weight/cost/destination) via migrasi Prisma
- [x] Lengkapi audit menyeluruh: Route & Auth Coverage Map + No Route Left Behind checklist
- [x] Tambah handling token expired (auto logout + `?sessionExpired=1` toast)
- [x] Refactor `admin/orders/[id]` dari mock ke data API real
- [x] Tambah test integrasi minimal untuk auth/admin/payment critical flow
- [x] Tambah alerting strategy webhook Midtrans (retry + observability)
- [x] Refactor halaman `/orders` ke data API publik berbasis `orderId+token` (tanpa ketergantungan auth admin)
- [x] Simpan riwayat referensi order publik di browser untuk buka ulang receipt/resi dengan aman
- [x] Fallback UI spesifik untuk kasus token order invalid/not found/timeout pada flow pending-success-orders
- [x] Smoke check flow checkout -> pending -> success -> orders -> verify via lint + build frontend
- [x] Rapikan konsistensi copy/status label pada flow pending -> success -> orders (Indonesia-first, tanpa label campuran)
- [x] Ekstrak helper presentasi order (receipt/resi/verifikasi/status) ke util bersama untuk mengurangi duplikasi antar halaman
- [x] Terapkan util presenter bersama ke halaman verifikasi resi publik (`/receipt/verify`) agar label status konsisten
- [x] Sentralisasi formatter harga/tanggal ke util presenter bersama dan adopsi di flow pending/success/orders/receipt-verify
- [x] Ekstrak template print receipt ke util bersama agar `/success` dan `/orders` pakai generator HTML yang konsisten
- [x] Satukan footer print receipt ke konstanta bersama agar konten footer konsisten di semua halaman receipt
- [x] Ekstrak template download TXT receipt ke util bersama agar `/success` dan `/orders` memakai format teks identik
- [x] Tambah unit test untuk util receipt/presenter agar format label/print/text tidak regresi saat refactor lanjutan
- [x] Perbaiki UX halaman `/shop`: teks harga filter tidak overflow dan pagination tidak lagi statis/membingungkan saat navigasi halaman
- [x] Buat pengaturan `Kategori Pilihan` berbasis campuran manual admin + produk populer otomatis di beranda
- [x] Implement form `Contact` ke backend (submit pesan real + field telepon/WhatsApp)
- [x] Tambah modul backend `contact-messages` (public submit + admin list/filter/update/bulk)
- [x] Tambah halaman admin `/admin/messages` dengan filter status, search, dan bulk update status
- [x] Update guard role `/admin/messages` untuk `SUPER_ADMIN | ADMIN | MANAGER`
- [x] Hapus fungsionalitas akun user lama (`/account`) dari flow aktif (route sekarang langsung `notFound`)
- [x] Hardening `/shop` untuk kurangi request berulang penyebab `429 Too Many Requests`
- [x] Perbaiki environment lokal agar login admin responsif (DB PostgreSQL aktif + backend tersambung)
- [x] Seed akun admin test role `MANAGER` untuk validasi alur `/admin/messages`
- [x] Kirim test pesan kontak dan verifikasi pesan masuk muncul di endpoint admin
- [x] Siapkan runbook + script remote deploy (Coolify + Nginx + Cloudflare Quick Tunnel) untuk eksekusi di server produksi test
- [x] Eksekusi remote server setup: SSH key access, Docker cleanup space, instalasi Coolify, Nginx reverse proxy, dan Cloudflare Quick Tunnel
- [x] Deploy stack Tumbas di server test (port non-konflik) + verifikasi endpoint utama
- [x] Rapikan route auth publik agar tidak membingungkan (`/login`, `/register`, `/forgot-password` -> redirect ke `/admin/login`)
- [x] Perbaiki fallback API base frontend ke `/api` agar login/dashboard tidak gagal saat diakses via reverse proxy/tunnel
- [x] Aktifkan Quick Tunnel khusus Coolify dashboard untuk akses panel saat port 8000 tidak direct-access dari jaringan user

## Verification Log
- [x] `npm run build` backend (post RajaOngkir + Midtrans shipping item details): pass
- [x] `npm run build` frontend (post cart realtime + checkout RajaOngkir): pass
- [x] `npm run test` backend (post OrdersService constructor update): pass
- [x] `npx prisma generate` backend (post install dependencies): pass
- [x] `npm run build` frontend (post variant matrix + variant checkout param): pass
- [x] `npm run build` backend (post variant stock + order variant fields): pass
- [x] `npm run test` backend (post variant/stock update): pass
- [ ] `npx prisma migrate dev --name add_product_variants_and_order_variant_fields`: gagal (`P1001 localhost:5432` DB lokal belum aktif)
- [x] Remote `prisma migrate deploy` saat Coolify deploy commit `e4354b4`: pass (migration `20260221123000_add_product_variants_and_order_variant_fields` applied)
- [x] Remote deploy commit `e0bb691`: pass; smoke test `/`, `/api`, `/api/shipping/cities`, `/api/shipping/rates`
- [x] `npm run build` frontend (post `/checkout/cart` multi-item): pass
- [x] `npm run build` backend (post `OrderItem` relation & stock deduction multi-item): pass
- [x] `npm run test` backend (post multi-item order service): pass
- [x] Update checkout UX: input lokasi pakai format `Kelurahan / Kecamatan` + validasi copy sesuai user test case
- [x] Update Snap flow: `Bayar Sekarang` membuka popup langsung, `onSuccess` langsung ke `/success` (resi + nota)
- [x] Perkuat readiness Snap popup sebelum create order agar error `popup belum siap` berkurang
- [x] Tambah endpoint `GET /api/auth/me` (JWT protected) untuk verifikasi route auth runtime
- [x] Audit error admin dari `Error.md`: perbaiki save settings tab Midtrans/Promo/Weekly/Shipping agar role `MANAGER` tidak lagi terblokir
- [x] Implement endpoint settings tambahan agar tab `Umum`, `Toko`, `Notifikasi` benar-benar bisa simpan (`/api/settings/general|store|notifications`)
- [x] Hilangkan data hardcoded pada `/admin/customers` dan ganti ke agregasi data pelanggan berbasis pesanan real
- [x] Sinkronkan UI multi-item di `/orders`, `/success`, dan `/admin/orders/[id]` agar tidak lagi fallback hard single-product
- [x] Perbarui template receipt TXT/print untuk mendukung daftar item (qty + varian) pada order multi-item
- [x] Perbaiki checkout city picker agar opsi kelurahan tidak muncul ulang setelah dipilih
- [x] Perbaiki checkout payment key loading: gunakan endpoint publik `settings/payment-public` untuk Snap client key
- [x] Upgrade notifikasi toast ke UI popup yang lebih rapi dan konsisten dengan desain aplikasi
- [x] `npm run build` frontend: pass
- [x] `npm run build` backend: pass
- [x] `npm test` backend: pass
- [ ] `docker compose up --build`: belum bisa diverifikasi di mesin tanpa Docker
- [x] Cek ketersediaan Docker CLI (`docker compose version`): gagal, `docker: command not found`
- [x] `npx eslint src/app/orders/page.tsx src/app/success/page.tsx src/app/checkout/[productId]/page.tsx src/lib/order-tracking.ts`: pass (warning existing `<img>` non-blocking)
- [x] `npx eslint src/app/orders/page.tsx src/app/success/page.tsx src/app/payment/pending/page.tsx src/app/payment/failed/page.tsx src/app/checkout/[productId]/page.tsx src/lib/order-tracking.ts`: pass (warning existing `<img>` non-blocking)
- [x] `npm run build` frontend (post-fallback update): pass
- [x] Migrasi `<img>` ke `next/image` pada checkout summary untuk hilangkan warning lint performa
- [x] `npx eslint src/app/checkout/[productId]/page.tsx`: pass
- [x] `npm run build` frontend (post-image optimization): pass
- [x] `npx eslint src/app/payment/pending/page.tsx src/app/success/page.tsx src/app/orders/page.tsx`: pass
- [x] `npm run build` frontend (post-copy/status cleanup): pass
- [x] `npx eslint src/lib/order-presenter.ts src/app/success/page.tsx src/app/orders/page.tsx`: pass
- [x] `npm run build` frontend (post-shared presenter refactor): pass
- [x] `npx eslint src/app/receipt/verify/page.tsx src/lib/order-presenter.ts`: pass
- [x] `npm run build` frontend (post-receipt-verify presenter adoption): pass
- [x] `npx eslint src/lib/order-presenter.ts src/app/success/page.tsx src/app/orders/page.tsx src/app/receipt/verify/page.tsx src/app/payment/pending/page.tsx`: pass
- [x] `npm run build` frontend (post-formatter centralization): pass
- [x] `npx eslint src/lib/receipt-print.ts src/app/success/page.tsx src/app/orders/page.tsx`: pass
- [x] `npm run build` frontend (post-receipt-print template extraction): pass
- [x] `npx eslint src/lib/receipt-print.ts src/app/success/page.tsx src/app/orders/page.tsx`: pass (post-footer-constant)
- [x] `npm run build` frontend (post-receipt-footer-unification): pass
- [x] `npx eslint src/lib/receipt-print.ts src/app/success/page.tsx src/app/orders/page.tsx`: pass (post-receipt-txt-template extraction)
- [x] `npm run build` frontend (post-receipt-txt-template extraction): pass
- [x] `npm run test` (tsx node:test untuk `src/lib/*.test.ts`): pass
- [x] `npm run build` frontend (post-unit-test setup): pass
- [x] `npx eslint src/app/shop/page.tsx`: pass (warning existing `<img>` non-blocking)
- [x] `npm run build` frontend (post-shop UX fix): pass
- [x] `npm run build` frontend (post-homepage-featured mix setting): pass
- [x] `npm run build` backend (post-settings homepage-featured endpoint): pass
- [x] `npx eslint src/app/contact/page.tsx src/app/shop/page.tsx src/app/admin/messages/page.tsx src/components/layout/AdminSidebar.tsx src/lib/api.ts proxy.ts`: pass (warning existing `<img>` non-blocking di `/shop`)
- [x] `npm run build` frontend (post-contact-messages + admin-messages): pass
- [x] `npm run build` backend (post-contact-messages module): pass
- [ ] `npx prisma migrate dev --name add_contact_messages`: gagal karena DB lokal belum aktif (`P1001 localhost:5432`)
- [x] PostgreSQL lokal aktif di `localhost:5432` (verified `TcpTestSucceeded=True`)
- [x] `npx prisma migrate dev --name add_contact_messages`: pass (migration applied)
- [x] `POST /api/contact-messages` test: pass (201 created)
- [x] `GET /api/contact-messages` (Bearer role `MANAGER`) test: pass (200)
- [x] Tambah dokumentasi remote setup: `deploy/REMOTE_SETUP.md`
- [x] Remote smoke test: home `200`, products API `200`, contact submit `201` via Quick Tunnel
- [x] Remote admin seed: `admin@tumbas.id` role `MANAGER`, login test `200`
- [x] Verifikasi route auth publik via tunnel: `/login` `307`, `/register` `307`, `/forgot-password` `307`
- [x] Perbaiki hook order checkout `/checkout/[productId]` agar tidak ada client-side exception akibat `useEffect` setelah early return
- [x] Hardening city picker checkout (`/checkout/[productId]` + `/checkout/cart`) dengan request-id guard agar saran kelurahan tidak muncul ulang dari response async lama
- [x] Refactor settings promo backend agar hanya baca/simpan key promo (hindari payload kontaminasi key lain yang memicu `property ... should not exist`)
- [x] Tambah fallback env Midtrans di settings payment backend agar Snap client key tetap tersedia saat nilai DB kosong
- [x] Upgrade `/admin/orders` dengan metrik, filter pengiriman, multi-select, aksi `Kelola`, dan tautan laporan
- [x] Tambah halaman `/admin/orders/report` (KPI, filter tanggal/status, export CSV)
- [x] `npm run build` frontend (post checkout+orders report hardening): pass
- [x] `npm run build` backend (post settings promo/payment fallback hardening): pass
- [x] `npm run test` frontend (`tsx --test src/lib/*.test.ts`): pass
- [x] `npm test` backend (`jest`): pass
- [x] Deploy Coolify commit `bb698d9`: pass (deployment `kcwcw88c4cogg0g4cgw4s08c`, status `finished`)
- [x] Smoke production: `/checkout/iphone-promax` `200`, `/checkout/cart` `200`, `/admin/orders` `200`, `/admin/orders/report` `200`
- [x] Smoke production API: `/api/settings/payment-public` `200`, `/api/settings/payment` `401`, `/api/settings/promo` payload clean (hanya key promo)
- [x] Hardening webhook Midtrans: validasi signature mendukung header `x-signature-key` dan body `signature_key`
- [x] Tambah fallback route `POST /api/orders/:id/sync-payment?token=...` untuk sinkronisasi status ke Midtrans saat webhook terlambat
- [x] Integrasi fallback sync status di halaman `/payment/pending`, `/success`, dan `/orders`
- [x] Tambah endpoint bulk konfirmasi ekspedisi `POST /api/orders/shipping/bulk-confirm` untuk operasi admin massal
- [x] `npm run build` backend (post webhook + payment sync hardening): pass
- [x] `npm test` backend (post webhook + payment sync hardening): pass
- [x] `npm run build` frontend (post payment sync adoption di pending/success/orders): pass
- [x] Smoke route auth: `POST /api/orders/:id/sync-payment` tanpa token `400`, token invalid `401`, token valid `200`
- [x] Verifikasi DB: order uji `PENDING -> PAID` via `sync-payment` berhasil pada produksi

## Webhook Observability Notes
- Endpoint monitor internal: `GET /api/webhook/midtrans/monitor?minutes=60` (role `SUPER_ADMIN` atau `ADMIN`)
- Retry processing webhook di backend: max retry dan delay dikontrol env
  - `WEBHOOK_MAX_RETRIES`
  - `WEBHOOK_RETRY_DELAY_MS`
- UI monitor admin tersedia di `/admin/webhooks` (auto refresh 15 detik)
- Export CSV tersedia di `/admin/webhooks` untuk data summary + recent issues
- Filter monitor tersedia: status, pencarian order ID, minimum attempts

## User Payment UX Notes
- Halaman sukses (`/success`) menampilkan receipt dan resi pengiriman + tombol download receipt
- Halaman pesanan (`/orders`) menampilkan receipt/resi untuk order sukses dan tombol download receipt
- Tambahan opsi cetak/simpan PDF receipt tersedia di `/success` dan `/orders`
- Receipt print kini memiliki kode verifikasi + QR data receipt
- Halaman verifikasi publik tersedia di `/receipt/verify` (cukup input resi pengiriman)
