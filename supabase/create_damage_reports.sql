-- Run this script in Supabase SQL Editor
-- Creates damage_reports table and related setup

create table if not exists public.damage_reports (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references public.infrastructure_assets(id) on delete set null,
  reporter_id uuid references public.users(id) on delete set null,
  reporter_name text,
  reporter_email text,
  reporter_phone text,
  damage_type text not null,
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

-- Enable RLS
alter table public.damage_reports enable row level security;

-- Allow anyone to insert damage reports (public form)
drop policy if exists "Allow anyone to create damage reports" on public.damage_reports;
create policy "Allow anyone to create damage reports"
  on public.damage_reports
  for insert
  to anon, authenticated
  with check (true);

-- Allow anyone to read damage reports (for tracking with ticket code)
drop policy if exists "Allow anyone to read damage reports" on public.damage_reports;
create policy "Allow anyone to read damage reports"
  on public.damage_reports
  for select
  to anon, authenticated
  using (true);

-- Allow authenticated users (admin/staff) to update damage reports
drop policy if exists "Allow authenticated to update damage reports" on public.damage_reports;
create policy "Allow authenticated to update damage reports"
  on public.damage_reports
  for update
  to authenticated
  using (true)
  with check (true);

-- Create view for public access (for tracking)
create or replace view public.damage_reports_public as
select
  id,
  damage_type,
  urgency_level,
  description,
  status,
  ticket_code,
  st_y(location::geometry) as latitude,
  st_x(location::geometry) as longitude,
  created_at,
  updated_at
from public.damage_reports;

grant select on public.damage_reports_public to anon, authenticated;
grant all on public.damage_reports to anon, authenticated;
