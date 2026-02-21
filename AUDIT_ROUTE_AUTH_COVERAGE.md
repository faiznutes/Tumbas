# Route & Auth Coverage Map

Dokumen ini merangkum audit route utama (frontend App Router + backend API Nest) untuk memastikan tidak ada route kritikal yang terlewat.

## A) Top Risks & Prioritas

1. **High** - Checkout masih single-product (`/checkout/[productId]`) sementara cart sudah multi-item quantity.
2. **High** - Migrasi Prisma untuk field variant/order baru belum ter-apply di DB lokal (P1001).
3. **Medium** - Header/admin route exposure sudah diperbaiki, namun perlu regression smoke test deploy.
4. **Medium** - Shipping provider `jnt/sicepat` pada RajaOngkir Starter masih fallback jalur starter.
5. **Medium** - Belum ada endpoint dedicated untuk stock lock/reservation sebelum payment settle.
6. **Low** - Beberapa route frontend masih static dan perlu test E2E role gating.

## B) Frontend Routes

| Route | Method | Public/Protected | Mekanisme | Sumber Identitas | Status |
|---|---|---|---|---|---|
| `/` | GET | Public | Client page | - | OK |
| `/shop` | GET | Public | Client page | - | OK |
| `/product/[slug]` | GET | Public | Client page | - | OK (variant selector ditambah) |
| `/cart` | GET | Public | Client page + localStorage | - | OK (cart realtime) |
| `/checkout/[productId]` | GET/POST client->API | Public | Client form + API server validation | - | Issue (single-item checkout) |
| `/orders` | GET | Public tokenized | token query + backend validation | public token | OK |
| `/success` | GET | Public tokenized | token query + backend validation | public token | OK |
| `/payment/pending` | GET | Public tokenized | token query + backend validation | public token | OK |
| `/receipt/verify` | GET | Public | backend verification endpoint | - | OK |
| `/admin/login` | GET/POST | Public | login API | JWT | OK |
| `/admin/*` | GET | Protected | proxy + token + role guard | cookie/local token | OK |

## C) Backend API Routes

| Route | Method | Public/Protected | Role | Guard | Status |
|---|---|---|---|---|---|
| `/api/auth/login` | POST | Public | - | validation pipe | OK |
| `/api/auth/register` | POST | Public | - | validation pipe | OK |
| `/api/products` | GET | Public | - | validation pipe | OK |
| `/api/products` | POST | Protected | admin roles by frontend flow | JWT | OK |
| `/api/products/:id` | PATCH/DELETE | Protected | admin roles by frontend flow | JWT | OK |
| `/api/orders` | GET | Protected | admin | JWT | OK |
| `/api/orders` | POST | Public | - | server-side validations | OK |
| `/api/orders/:id/public` | GET | Public tokenized | - | HMAC token check | OK |
| `/api/orders/verify-receipt` | GET | Public | - | validation + service checks | OK |
| `/api/orders/verify-resi` | GET | Public | - | validation + service checks | OK |
| `/api/orders/:id/shipping/confirm` | POST | Protected | SUPER_ADMIN/ADMIN/MANAGER | JWT + Roles | OK |
| `/api/settings/*` GET | GET | Public | - | service defaults | OK |
| `/api/settings/*` POST | POST | Protected | SUPER_ADMIN/ADMIN/MANAGER | JWT + Roles | OK |
| `/api/shipping/cities` | GET | Public | - | validation | OK |
| `/api/shipping/rates` | POST | Public | - | validation + server-side API | OK |
| `/api/contact-messages` | POST | Public | - | validation | OK |
| `/api/contact-messages` | GET/PATCH/POST bulk | Protected | SUPER_ADMIN/ADMIN/MANAGER | JWT + Roles | OK |
| `/api/webhook/midtrans` | POST | Public (provider) | - | signature validation | OK |
| `/api/webhook/midtrans/monitor` | GET | Protected | SUPER_ADMIN/ADMIN | JWT + Roles | OK |

## D) Security & Auth Area Notes

- **Auth flow**: login/register + JWT works, admin pages protected by proxy/guards.
- **Authorization**: settings/messages/webhook monitor menggunakan role guard.
- **Validation**: global `ValidationPipe` aktif (`whitelist`, `forbidNonWhitelisted`, `transform`).
- **Rate limit**: global throttler aktif.
- **Webhook security**: Midtrans signature validation + retries + logging.
- **Secret handling**: env keys tetap diperlukan untuk Midtrans/RajaOngkir; jangan commit secret file.

## E) No Route Left Behind Checklist

- Frontend app routes dicek melalui hasil `next build` route map.
- Backend route map dicek melalui controller module: auth, users, products, orders, payments/webhook, settings, shipping, contact-messages.
- Route kritikal checkout/auth/webhook/settings sudah diverifikasi pada level code path.

## F) Patch Plan (PR sequence)

1. **PR-1 (done in workspace)**: RajaOngkir rates + Midtrans shipping item + cart realtime + header cleanup.
2. **PR-2 (done in workspace)**: Variant matrix 2 atribut (admin create/edit + user select + order capture variant).
3. **PR-3 (next)**: Multi-item checkout + order items table + stock reservation.
4. **PR-4 (next)**: E2E regression suite (auth, cart, checkout, shipping, webhook).
