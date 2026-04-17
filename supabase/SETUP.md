# Supabase Setup (InfraTrack MVP)

## 1) Environment Variables (Frontend)
Create `.env` from `.env.example`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Use publishable key only in frontend.
Do not put secret key in `.env` frontend.

## 2) Run SQL for Table + View + RLS
Run in Supabase SQL Editor:

1. `supabase/create_master_reference_tables.sql`
2. `supabase/create_infrastructure_assets.sql`
3. `supabase/create_damage_reports.sql` (untuk PBI-02)
4. `supabase/create_users.sql` (tabel users + field officers view)
5. `supabase/create_maintenance_tasks.sql` (untuk PBI-04)
6. `supabase/setup_assets_photos_storage.sql`
7. `supabase/setup_damage_reports_storage.sql` (untuk upload foto laporan kerusakan)

Catatan RBAC:
- Script di atas sudah menerapkan kebijakan role-based access control (RBAC).
- Modul admin (manajemen aset, master data, dan penugasan pemeliharaan) hanya bisa diakses akun dengan role `admin` pada `app_metadata`.

## 3) Buat Akun Admin
1. Daftarkan user admin dulu via Supabase Auth (email + password).
2. Jalankan `supabase/setup_admin_role.sql` lalu ganti nilai `v_admin_email` sesuai email admin.
3. Login ulang akun tersebut agar JWT terbaru memuat role `admin`.

## 4) Setup Storage Buckets
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

## 5) Query Patterns (lat/lng)
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
  infrastructure_category_id,
  location,
  condition,
  year_built,
  photo_url
)
values (
  'Jalan Raya Mawar',
  (
    select id
    from public.infrastructure_categories
    where name = 'Jalan'
    limit 1
  ),
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
  damage_type_id,
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
  (
    select id
    from public.damage_types
    where name = 'Lainnya'
    order by is_default desc, created_at asc
    limit 1
  ),
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

## 6) JS Insert Tip
For Supabase JS insert/update, send `location` as EWKT string:

```js
const location = `SRID=4326;POINT(${lng} ${lat})`;
```

Then insert into `public.infrastructure_assets` or `public.damage_reports` dengan kolom FK (`infrastructure_category_id`, `damage_type_id`).
For reading, query `public.infrastructure_assets_view` or `public.damage_reports` to get `lat` and `lng` directly.

## 7) PBI-02 Features (Damage Report)
Features implemented:
- Form pelaporan kerusakan publik (tidak perlu login)
- GPS browser geolocation untuk deteksi lokasi otomatis
- Upload foto kerusakan ke Supabase Storage
- Generate kode tiket unik untuk setiap laporan
- Validasi input form
- Halaman tracking untuk masyarakat melacak status laporan dengan kode tiket

## 8) Troubleshooting Upload Foto
Jika muncul error seperti:

`new row violates row-level security policy`

Pastikan script berikut sudah dijalankan di SQL Editor:
- `supabase/setup_damage_reports_storage.sql`

Lalu cek bucket `damage-reports` ada di Supabase Storage dan statusnya Public.

## 9) PBI-04 Notes (Maintenance Assignment)
- Untuk patch permission cepat di environment lama, jalankan `supabase/fix_pbi04_permissions.sql`.
- Untuk data uji laporan terverifikasi, jalankan `supabase/seed_dummy_verified_report.sql`.
- Fitur penugasan pemeliharaan hanya untuk admin, jadi pastikan akun sudah mendapat role `admin` dan login ulang setelah update role.

