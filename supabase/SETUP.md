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
2. `supabase/setup_assets_photos_storage.sql`

## 3) Query Patterns (lat/lng)
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

Update point by lat/lng:

```sql
update public.infrastructure_assets
set location = st_setsrid(st_makepoint(106.82, -6.21), 4326)::geography
where id = '00000000-0000-0000-0000-000000000000';
```

## 4) JS Insert Tip
For Supabase JS insert/update, send `location` as EWKT string:

```js
const location = `SRID=4326;POINT(${lng} ${lat})`;
```

Then insert into `public.infrastructure_assets`.
For reading, query `public.infrastructure_assets_view` to get `lat` and `lng` directly.
