# Supabase Setup (InfraTrack MVP)

## 1) Environment Variables (Frontend)
Create `.env` from `.env.example`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Use publishable key only in frontend.
Do not put secret key in `.env` frontend.

## 2) Run SQL for Table + View + RLS
Run in Supabase SQL Editor:

1. `supabase/create_infrastructure_assets.sql`
2. `supabase/create_master_reference_tables.sql`
3. `supabase/setup_assets_photos_storage.sql`
4. `supabase/create_damage_reports.sql` (untuk PBI-02)
5. `supabase/setup_damage_reports_storage.sql` (untuk upload foto laporan kerusakan)

## 3) Setup Storage Buckets
In Supabase Dashboard > Storage:

### Create two buckets:
1. **assets-photos** (for infrastructure assets)
   - Public bucket
   - Allowed file types: jpg, jpeg, png, gif, webp
   - Max file size: 10MB

2. **damage-reports** (for damage report photos)
   - Public bucket
   - Allowed file types: jpg, jpeg, png, gif, webp
   - Max file size: 5MB

## 4) Query Patterns (lat/lng)
Read assets from the view:

```sql
select *
from public.infrastructure_assets_view
order by created_at desc;
```

Insert asset from lat/lng:

```sql
insert into public.infrastructure_assets (
  name,
  category,
  location,
  condition,
  year_built,
  photo_url
)
values (
  'Jalan Raya Mawar',
  'Jalan',
  st_setsrid(st_makepoint(106.816666, -6.2), 4326)::geography,
  'baik',
  2020,
  'https://example.com/photo.jpg'
);
```

Insert damage report:

```sql
insert into public.damage_reports (
  reporter_name,
  reporter_email,
  reporter_phone,
  damage_type,
  urgency_level,
  description,
  photo_url,
  location,
  latitude,
  longitude,
  ticket_code
)
values (
  'Budi Santoso',
  'budi@example.com',
  '081234567890',
  'Jalan berlubang',
  'tinggi',
  'Lubang besar di depan toko mie',
  'https://example.com/photo.jpg',
  st_setsrid(st_makepoint(106.816666, -6.2), 4326)::geography,
  -6.2,
  106.816666,
  'INF-20240101-ABC12'
);
```

Update point by lat/lng:

```sql
update public.infrastructure_assets
set location = st_setsrid(st_makepoint(106.82, -6.21), 4326)::geography
where id = '00000000-0000-0000-0000-000000000000';
```

## 5) JS Insert Tip
For Supabase JS insert/update, send `location` as EWKT string:

```js
const location = `SRID=4326;POINT(${lng} ${lat})`;
```

Then insert into `public.infrastructure_assets` or `public.damage_reports`.
For reading, query `public.infrastructure_assets_view` or `public.damage_reports` to get `lat` and `lng` directly.

## 6) PBI-02 Features (Damage Report)
Features implemented:
- Form pelaporan kerusakan publik (tidak perlu login)
- GPS browser geolocation untuk deteksi lokasi otomatis
- Upload foto kerusakan ke Supabase Storage
- Generate kode tiket unik untuk setiap laporan
- Validasi input form
- Halaman tracking untuk masyarakat melacak status laporan dengan kode tiket

## 7) Troubleshooting Upload Foto
Jika muncul error seperti:

`new row violates row-level security policy`

Pastikan script berikut sudah dijalankan di SQL Editor:
- `supabase/setup_damage_reports_storage.sql`

Lalu cek bucket `damage-reports` ada di Supabase Storage dan statusnya Public.

