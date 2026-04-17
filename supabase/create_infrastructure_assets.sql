-- Run this script in Supabase SQL Editor
-- Required for geography(POINT, 4326) and UUID generation
create extension if not exists postgis;
create extension if not exists pgcrypto;

create table if not exists public.infrastructure_assets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  location geography(point, 4326) not null,
  condition text not null check (condition in ('baik', 'rusak ringan', 'rusak berat')),
  year_built int not null check (
    year_built between 1800 and extract(year from now())::int
  ),
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_infrastructure_assets_updated_at
  on public.infrastructure_assets;

create trigger trg_infrastructure_assets_updated_at
before update on public.infrastructure_assets
for each row
execute function public.set_updated_at_timestamp();

create index if not exists infrastructure_assets_location_gix
  on public.infrastructure_assets
  using gist (location);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'infrastructure_assets'
      and column_name = 'infrastructure_category_id'
  ) then
    execute $view$
      create or replace view public.infrastructure_assets_view as
      select
        assets.id,
        assets.name,
        coalesce(categories.name, '-') as category,
        st_y(assets.location::geometry) as lat,
        st_x(assets.location::geometry) as lng,
        assets.condition,
        assets.year_built,
        assets.photo_url,
        assets.created_at,
        assets.updated_at
      from public.infrastructure_assets assets
      left join public.infrastructure_categories categories
        on categories.id = assets.infrastructure_category_id
    $view$;
  else
    execute $view$
      create or replace view public.infrastructure_assets_view as
      select
        id,
        name,
        category,
        st_y(location::geometry) as lat,
        st_x(location::geometry) as lng,
        condition,
        year_built,
        photo_url,
        created_at,
        updated_at
      from public.infrastructure_assets
    $view$;
  end if;
end
$$;

alter table public.infrastructure_assets enable row level security;

grant select on public.infrastructure_assets_view to anon, authenticated;

-- Development-only policy so frontend can work before auth is implemented.
-- Replace with stricter policies in production.
drop policy if exists "Dev full access to infrastructure assets"
  on public.infrastructure_assets;

drop policy if exists "Allow authenticated full access to infrastructure assets"
  on public.infrastructure_assets;

create policy "Dev full access to infrastructure assets"
  on public.infrastructure_assets
  for all
  to anon, authenticated
  using (true)
  with check (true);
