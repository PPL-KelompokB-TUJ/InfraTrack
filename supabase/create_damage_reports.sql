-- Run this script in Supabase SQL Editor
-- Creates damage_reports table and related setup

create table if not exists public.damage_reports (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references public.infrastructure_assets(id) on delete set null,
  reporter_id uuid references auth.users(id) on delete set null,
  reporter_name text,
  reporter_email text,
  reporter_phone text,
  damage_type_id uuid not null references public.damage_types(id) on update cascade on delete restrict,
  urgency_level text not null check (urgency_level in ('rendah', 'sedang', 'tinggi', 'sangat tinggi')),
  description text not null,
  photo_url text,
  location geography(point, 4326) not null,
  latitude float,
  longitude float,
  status text not null default 'pending' check (status in ('pending', 'terverifikasi', 'ditolak', 'sedang_dikerjakan', 'selesai')),
  ticket_code text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Backward-compatible migration for old schema where damage_type was text
alter table public.damage_reports
  add column if not exists damage_type_id uuid;

do $$
declare
  v_default_damage_type_id uuid;
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'damage_reports_damage_type_fk'
      and conrelid = 'public.damage_reports'::regclass
  ) then
    alter table public.damage_reports
      add constraint damage_reports_damage_type_fk
      foreign key (damage_type_id)
      references public.damage_types(id)
      on update cascade
      on delete restrict;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'damage_reports'
      and column_name = 'damage_type'
  ) then
    update public.damage_reports reports
    set damage_type_id = (
      select dt.id
      from public.damage_types dt
      where lower(trim(dt.name)) = lower(trim(reports.damage_type))
      order by dt.is_default desc, dt.created_at asc
      limit 1
    )
    where reports.damage_type_id is null;
  end if;

  select id
  into v_default_damage_type_id
  from public.damage_types
  where is_default = true
  order by created_at asc
  limit 1;

  if v_default_damage_type_id is null then
    select id
    into v_default_damage_type_id
    from public.damage_types
    order by created_at asc
    limit 1;
  end if;

  if v_default_damage_type_id is not null then
    update public.damage_reports
    set damage_type_id = v_default_damage_type_id
    where damage_type_id is null;
  end if;

  if not exists (
    select 1
    from public.damage_reports
    where damage_type_id is null
  ) then
    alter table public.damage_reports
      alter column damage_type_id set not null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'damage_reports'
      and column_name = 'damage_type'
  ) and not exists (
    select 1
    from public.damage_reports
    where damage_type_id is null
  ) then
    drop view if exists public.damage_reports_public;

    alter table public.damage_reports
      drop column damage_type;
  end if;
end
$$;

-- Create updated_at trigger
create or replace function public.set_damage_reports_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_damage_reports_updated_at on public.damage_reports;

create trigger trg_damage_reports_updated_at
before update on public.damage_reports
for each row
execute function public.set_damage_reports_updated_at_timestamp();

-- Create indexes for better query performance
create index if not exists damage_reports_ticket_code_idx on public.damage_reports(ticket_code);
create index if not exists damage_reports_location_gix on public.damage_reports using gist(location);
create index if not exists damage_reports_status_idx on public.damage_reports(status);
create index if not exists damage_reports_created_at_idx on public.damage_reports(created_at);
create index if not exists damage_reports_damage_type_id_idx on public.damage_reports(damage_type_id);

-- Enable RLS
alter table public.damage_reports enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- Allow anyone to insert damage reports (public form)
drop policy if exists "Allow anyone to create damage reports" on public.damage_reports;
drop policy if exists "Allow anyone create damage reports" on public.damage_reports;
create policy "Allow anyone create damage reports"
  on public.damage_reports
  for insert
  to anon, authenticated
  with check (true);

-- Admin can read/update/delete all reports from base table.
drop policy if exists "Allow anyone to read damage reports" on public.damage_reports;
drop policy if exists "Allow authenticated to update damage reports" on public.damage_reports;
drop policy if exists "Admin full access to damage reports" on public.damage_reports;
create policy "Admin full access to damage reports"
  on public.damage_reports
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Create view for public access (for tracking)
create or replace view public.damage_reports_public as
select
  reports.id,
  coalesce(types.name, '-') as damage_type,
  reports.urgency_level,
  reports.description,
  reports.photo_url,
  reports.status,
  reports.ticket_code,
  st_y(reports.location::geometry) as latitude,
  st_x(reports.location::geometry) as longitude,
  reports.created_at,
  reports.updated_at
from public.damage_reports reports
left join public.damage_types types
  on types.id = reports.damage_type_id;

revoke all on public.damage_reports from anon, authenticated;
grant insert on public.damage_reports to anon, authenticated;
grant select, update, delete on public.damage_reports to authenticated;

revoke all on public.damage_reports_public from anon, authenticated;
grant select on public.damage_reports_public to anon, authenticated;
