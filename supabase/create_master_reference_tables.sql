-- PBI-09: Master data referensi
-- Run in Supabase SQL Editor after create_infrastructure_assets.sql
create extension if not exists pgcrypto;

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.infrastructure_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.damage_types (
  id uuid primary key default gen_random_uuid(),
  infrastructure_category_id uuid not null references public.infrastructure_categories(id) on update cascade on delete restrict,
  name text not null,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint damage_types_unique_name_per_category unique (infrastructure_category_id, name)
);

create table if not exists public.priority_scales (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  level int not null unique check (level between 1 and 10),
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists infrastructure_categories_single_default_idx
  on public.infrastructure_categories (is_default)
  where is_default = true;

create unique index if not exists damage_types_single_default_idx
  on public.damage_types (is_default)
  where is_default = true;

create unique index if not exists priority_scales_single_default_idx
  on public.priority_scales (is_default)
  where is_default = true;

drop trigger if exists trg_infrastructure_categories_updated_at
  on public.infrastructure_categories;

create trigger trg_infrastructure_categories_updated_at
before update on public.infrastructure_categories
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists trg_damage_types_updated_at
  on public.damage_types;

create trigger trg_damage_types_updated_at
before update on public.damage_types
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists trg_priority_scales_updated_at
  on public.priority_scales;

create trigger trg_priority_scales_updated_at
before update on public.priority_scales
for each row
execute function public.set_updated_at_timestamp();

alter table public.infrastructure_categories enable row level security;
alter table public.damage_types enable row level security;
alter table public.priority_scales enable row level security;

drop policy if exists "Dev full access to infrastructure categories"
  on public.infrastructure_categories;

create policy "Dev full access to infrastructure categories"
  on public.infrastructure_categories
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "Dev full access to damage types"
  on public.damage_types;

create policy "Dev full access to damage types"
  on public.damage_types
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "Dev full access to priority scales"
  on public.priority_scales;

create policy "Dev full access to priority scales"
  on public.priority_scales
  for all
  to anon, authenticated
  using (true)
  with check (true);

insert into public.infrastructure_categories (name, is_default, is_active)
values
  ('Jalan', false, true),
  ('Jembatan', false, true),
  ('Fasum', false, true)
on conflict (name) do update
set is_active = excluded.is_active;

update public.infrastructure_categories
set is_default = true
where id = (
  select id
  from public.infrastructure_categories
  where name = 'Jalan'
  limit 1
)
and not exists (
  select 1
  from public.infrastructure_categories
  where is_default = true
);

insert into public.damage_types (name, infrastructure_category_id, is_default, is_active)
select 'Lainnya', id, false, true
from public.infrastructure_categories
where name in ('Jalan', 'Jembatan', 'Fasum')
on conflict (infrastructure_category_id, name) do update
set is_active = excluded.is_active;

update public.damage_types
set is_default = true
where id = (
  select id
  from public.damage_types
  order by created_at asc
  limit 1
)
and not exists (
  select 1
  from public.damage_types
  where is_default = true
);

insert into public.priority_scales (name, level, is_default, is_active)
values
  ('Rendah', 1, false, true),
  ('Sedang', 2, false, true),
  ('Tinggi', 3, false, true)
on conflict (name) do update
set level = excluded.level,
    is_active = excluded.is_active;

update public.priority_scales
set is_default = true
where name = 'Sedang'
and not exists (
  select 1
  from public.priority_scales
  where is_default = true
);
