
-- ============================================
-- File: create_infrastructure_assets.sql
-- ============================================

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
from public.infrastructure_assets;

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


-- ============================================
-- File: setup_assets_photos_storage.sql
-- ============================================

-- Run this script after table setup
insert into storage.buckets (id, name, public)
values ('assets-photos', 'assets-photos', true)
on conflict (id) do nothing;

-- Development-only policies for quick MVP iteration.
-- Replace with stricter policies in production.
drop policy if exists "Dev read photos assets-photos" on storage.objects;
create policy "Dev read photos assets-photos"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'assets-photos');

drop policy if exists "Dev upload photos assets-photos" on storage.objects;
create policy "Dev upload photos assets-photos"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'assets-photos');

drop policy if exists "Dev update photos assets-photos" on storage.objects;
create policy "Dev update photos assets-photos"
  on storage.objects
  for update
  to anon, authenticated
  using (bucket_id = 'assets-photos')
  with check (bucket_id = 'assets-photos');

drop policy if exists "Dev delete photos assets-photos" on storage.objects;
create policy "Dev delete photos assets-photos"
  on storage.objects
  for delete
  to anon, authenticated
  using (bucket_id = 'assets-photos');


-- ============================================
-- File: create_damage_reports.sql
-- ============================================

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


-- ============================================
-- File: setup_damage_reports_storage.sql
-- ============================================

-- Run this in Supabase SQL Editor to setup storage policies for damage-reports

-- Create the damage-reports bucket if not exists
-- This should be done via Supabase Dashboard > Storage > Create New Bucket
-- Name: damage-reports
-- Public: true
-- File size limit: 5240880 bytes (5MB)
-- Allowed MIME types: image/jpeg, image/png, image/gif, image/webp

-- Enable RLS on storage
alter table if exists storage.objects enable row level security;

-- Policy to allow anyone to upload damage report photos
drop policy if exists "Enable damage report photo uploads" on storage.objects;
create policy "Enable damage report photo uploads"
  on storage.objects
  for insert
  to anon, authenticated
  with check (
    bucket_id = 'damage-reports'
    and (storage.filename(name))::text ~ '\.jpg$|\.jpeg$|\.png$|\.gif$|\.webp$'::text
  );

-- Policy to allow anyone to read damage report photos
drop policy if exists "Enable damage report photo reads" on storage.objects;
create policy "Enable damage report photo reads"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'damage-reports');


-- ============================================
-- File: create_maintenance_tasks.sql
-- ============================================

-- Run this script in Supabase SQL Editor
-- Creates maintenance_tasks table and related setup

create table if not exists public.maintenance_tasks (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.damage_reports(id) on delete set null,
  asset_id uuid references public.infrastructure_assets(id) on delete set null,
  assigned_to uuid references public.users(id) on delete set null,
  assigned_by uuid references public.users(id) on delete set null,
  scheduled_date timestamp not null,
  estimated_cost decimal(12, 2),
  status text not null default 'pending' check (status in ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
  instructions text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create updated_at trigger
create or replace function public.set_maintenance_tasks_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_maintenance_tasks_updated_at on public.maintenance_tasks;

create trigger trg_maintenance_tasks_updated_at
before update on public.maintenance_tasks
for each row
execute function public.set_maintenance_tasks_updated_at_timestamp();

-- Create indexes for better query performance
create index if not exists maintenance_tasks_report_id_idx on public.maintenance_tasks(report_id);
create index if not exists maintenance_tasks_asset_id_idx on public.maintenance_tasks(asset_id);
create index if not exists maintenance_tasks_assigned_to_idx on public.maintenance_tasks(assigned_to);
create index if not exists maintenance_tasks_status_idx on public.maintenance_tasks(status);
create index if not exists maintenance_tasks_scheduled_date_idx on public.maintenance_tasks(scheduled_date);

-- Enable RLS
alter table public.maintenance_tasks enable row level security;

-- Create notifications table if not exists
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  related_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create notification trigger
create or replace function public.set_notifications_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_notifications_updated_at on public.notifications;

create trigger trg_notifications_updated_at
before update on public.notifications
for each row
execute function public.set_notifications_updated_at_timestamp();

-- Create indexes for notifications
create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists notifications_is_read_idx on public.notifications(is_read);
create index if not exists notifications_created_at_idx on public.notifications(created_at);

-- Enable RLS
alter table public.notifications enable row level security;

