# Coolify DB Checklist (Tumbas)

Gunakan checklist ini agar error `database "tumbas" does not exist` tidak muncul lagi.

## 1) Postgres Service

- `POSTGRES_DB=tumbas_market`
- `POSTGRES_USER=<user_db_anda>`
- `POSTGRES_PASSWORD=<password_db_anda>`

## 2) Backend Service Environment

- `DATABASE_URL=postgresql://<user_db_anda>:<password_db_anda>@<host_db>:5432/tumbas_market?schema=public`
- `EXPECTED_DB_NAME=tumbas_market`

Contoh host:
- jika satu network Coolify: `@db:5432`
- jika external postgres: `@<ip-atau-hostname>:5432`

## 3) Validasi di Container Backend

Jalankan:

```bash
printenv DATABASE_URL
printenv EXPECTED_DB_NAME
```

Pastikan nama DB pada `DATABASE_URL` adalah `tumbas_market`.

## 4) Validasi di Container Postgres

Jalankan:

```bash
psql -U <user_db_anda> -d postgres -c "\l"
```

Pastikan database `tumbas_market` ada.

## 5) Migrasi Prisma (sekali setelah deploy)

```bash
npx prisma migrate deploy
npx prisma generate
```

## 6) Redeploy Sequence

1. Simpan env Postgres
2. Simpan env Backend
3. Redeploy Postgres (jika env berubah)
4. Redeploy Backend

## 7) Fallback Darurat (opsional)

Kalau masih ada service lama yang hardcoded ke DB `tumbas`, buat alias sementara:

```sql
CREATE DATABASE tumbas;
GRANT ALL PRIVILEGES ON DATABASE tumbas TO <user_db_anda>;
```

Lalu audit service lama dan ubah semua ke `tumbas_market`.
