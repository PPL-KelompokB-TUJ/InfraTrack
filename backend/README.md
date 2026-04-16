# InfraTrack Backend (Tahap 0 & 1)

## 1) Setup
1. Salin `.env.example` menjadi `.env` dan sesuaikan nilai koneksi.
2. Install dependency:
   - `npm install`
3. Jalankan server:
   - `npm run dev`

## 2) Urutan Migration SQL
Jalankan file SQL berikut secara berurutan pada PostgreSQL:
1. `db/migrations/001_enable_postgis.sql`
2. `db/migrations/002_create_users.sql`
3. `db/migrations/003_create_asset_categories.sql`
4. `db/migrations/004_create_infrastructure_assets.sql`

## 3) Endpoint API (Semua khusus Administrator)
Semua endpoint wajib memakai header Authorization: Bearer <jwt-token>

### Asset Categories
- GET /api/asset-categories
  - Query optional: onlyActive=true|false

### Infrastructure Assets
- GET /api/infrastructure-assets
  - Query optional: search, categoryId, status
- GET /api/infrastructure-assets/:id
- POST /api/infrastructure-assets
  - Multipart form-data, file foto gunakan field: photo
- PUT /api/infrastructure-assets/:id
  - Multipart form-data, file foto gunakan field: photo
- DELETE /api/infrastructure-assets/:id

## 4) JWT Payload Minimal
Pastikan payload token menyertakan role, contoh:
{
  "sub": 1,
  "email": "admin@infratrack.local",
  "role": "Administrator"
}

## 5) Catatan Upload Foto
- Service upload memakai AWS SDK v3 yang kompatibel dengan AWS S3 maupun MinIO.
- URL yang disimpan ke database berasal dari S3_PUBLIC_BASE_URL jika disediakan.
