-- ========================================
-- InfraTrack Database Setup - Complete
-- Run all migrations to create tables
-- April 20, 2026
-- ========================================

-- Step 1: Create Users & User Profiles Tables
-- ============================================
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  role text not null check (role in ('admin', 'field_officer', 'citizen')),
  is_active boolean not null default true,
  profile_photo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  specialization text,
  work_area text,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Step 2: Create Infrastructure Assets Table
-- ==========================================
-- Note: Using existing schema with geography(point, 4326)
-- Run this only if table doesn't exist:
-- create extension if not exists postgis;
-- create extension if not exists pgcrypto;

-- Infrastructure assets table already has: id, name, category, location, condition, year_built, photo_url, created_at, updated_at
-- Skip recreation since it already exists with proper schema

-- Step 3: Create Damage Reports Table
-- ===================================
create table if not exists public.damage_reports (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.infrastructure_assets(id) on delete set null,
  reporter_id uuid references public.users(id) on delete set null,
  damage_type text,
  urgency_level text check (urgency_level in ('rendah', 'sedang', 'tinggi', 'sangat tinggi')),
  description text,
  photo_url text,
  latitude float,
  longitude float,
  status text not null default 'pending' check (status in ('pending', 'verified', 'in_progress', 'completed', 'rejected')),
  ticket_code text unique,
  verification_notes text,
  verification_priority text,
  verified_by uuid references public.users(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Step 4: Create Maintenance Tasks Table
-- ======================================
create table if not exists public.maintenance_tasks (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.damage_reports(id) on delete cascade,
  asset_id uuid not null references public.infrastructure_assets(id) on delete cascade,
  assigned_to uuid not null references public.users(id) on delete restrict,
  assigned_by uuid references public.users(id) on delete set null,
  scheduled_date date not null,
  estimated_cost numeric(12,2),
  instructions text,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Step 5: Create Notifications Table
-- ==================================
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

-- Step 6: Create Triggers for updated_at
-- ======================================
create or replace function public.set_users_updated_at_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at before update on public.users for each row
execute function public.set_users_updated_at_timestamp();

create or replace function public.set_user_profiles_updated_at_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_profiles_updated_at on public.user_profiles;
create trigger trg_user_profiles_updated_at before update on public.user_profiles for each row
execute function public.set_user_profiles_updated_at_timestamp();

create or replace function public.set_infrastructure_assets_updated_at_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_infrastructure_assets_updated_at on public.infrastructure_assets;
create trigger trg_infrastructure_assets_updated_at before update on public.infrastructure_assets for each row
execute function public.set_infrastructure_assets_updated_at_timestamp();

create or replace function public.set_damage_reports_updated_at_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_damage_reports_updated_at on public.damage_reports;
create trigger trg_damage_reports_updated_at before update on public.damage_reports for each row
execute function public.set_damage_reports_updated_at_timestamp();

create or replace function public.set_maintenance_tasks_updated_at_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_maintenance_tasks_updated_at on public.maintenance_tasks;
create trigger trg_maintenance_tasks_updated_at before update on public.maintenance_tasks for each row
execute function public.set_maintenance_tasks_updated_at_timestamp();

create or replace function public.set_notifications_updated_at_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_notifications_updated_at on public.notifications;
create trigger trg_notifications_updated_at before update on public.notifications for each row
execute function public.set_notifications_updated_at_timestamp();

-- Step 7: Create Indexes
-- ====================
create index if not exists users_email_idx on public.users(email);
create index if not exists users_role_idx on public.users(role);
create index if not exists user_profiles_user_id_idx on public.user_profiles(user_id);
-- infrastructure_assets already has index on location (gist)
create index if not exists damage_reports_reporter_idx on public.damage_reports(reporter_id);
create index if not exists damage_reports_asset_idx on public.damage_reports(asset_id);
create index if not exists damage_reports_status_idx on public.damage_reports(status);
create index if not exists maintenance_tasks_assigned_to_idx on public.maintenance_tasks(assigned_to);
create index if not exists maintenance_tasks_status_idx on public.maintenance_tasks(status);
create index if not exists notifications_user_id_idx on public.notifications(user_id);

-- Step 8: Enable RLS
-- ================
alter table public.users enable row level security;
alter table public.user_profiles enable row level security;
alter table public.infrastructure_assets enable row level security;
alter table public.damage_reports enable row level security;
alter table public.maintenance_tasks enable row level security;
alter table public.notifications enable row level security;

-- Step 9: Create RLS Policies
-- ==========================

-- Users table policies
drop policy if exists "Authenticated can view users" on public.users;
create policy "Authenticated can view users"
  on public.users for select to authenticated using (true);

drop policy if exists "Users can update own record" on public.users;
create policy "Users can update own record"
  on public.users for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- User profiles policies
drop policy if exists "Authenticated can view user profiles" on public.user_profiles;
create policy "Authenticated can view user profiles"
  on public.user_profiles for select to authenticated using (true);

drop policy if exists "Users can manage own profile" on public.user_profiles;
create policy "Users can manage own profile"
  on public.user_profiles for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Infrastructure assets policies
drop policy if exists "Authenticated can view assets" on public.infrastructure_assets;
create policy "Authenticated can view assets"
  on public.infrastructure_assets for select to authenticated using (true);

drop policy if exists "Authenticated can manage assets" on public.infrastructure_assets;
create policy "Authenticated can manage assets"
  on public.infrastructure_assets for all to authenticated using (true) with check (true);

-- Damage reports policies
drop policy if exists "Authenticated can view reports" on public.damage_reports;
create policy "Authenticated can view reports"
  on public.damage_reports for select to authenticated using (true);

drop policy if exists "Authenticated can create reports" on public.damage_reports;
create policy "Authenticated can create reports"
  on public.damage_reports for insert to authenticated with check (true);

drop policy if exists "Authenticated can update reports" on public.damage_reports;
create policy "Authenticated can update reports"
  on public.damage_reports for update to authenticated using (true) with check (true);

-- Maintenance tasks policies
drop policy if exists "Authenticated can view tasks" on public.maintenance_tasks;
create policy "Authenticated can view tasks"
  on public.maintenance_tasks for select to authenticated using (true);

drop policy if exists "Authenticated can create tasks" on public.maintenance_tasks;
create policy "Authenticated can create tasks"
  on public.maintenance_tasks for insert to authenticated with check (true);

drop policy if exists "Authenticated can update tasks" on public.maintenance_tasks;
create policy "Authenticated can update tasks"
  on public.maintenance_tasks for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated can delete tasks" on public.maintenance_tasks;
create policy "Authenticated can delete tasks"
  on public.maintenance_tasks for delete to authenticated using (true);

-- Notifications policies
drop policy if exists "Authenticated can view notifications" on public.notifications;
create policy "Authenticated can view notifications"
  on public.notifications for select to authenticated using (true);

drop policy if exists "Create notifications" on public.notifications;
create policy "Create notifications"
  on public.notifications for insert to authenticated with check (true);

drop policy if exists "Update own notifications" on public.notifications;
create policy "Update own notifications"
  on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Step 10: Grant permissions
-- =========================
grant select, insert, update, delete on public.users to authenticated;
grant select, insert, update, delete on public.user_profiles to authenticated;
grant select, insert, update, delete on public.infrastructure_assets to authenticated;
grant select, insert, update, delete on public.damage_reports to authenticated;
grant select, insert, update, delete on public.maintenance_tasks to authenticated;
grant select, insert, update, delete on public.notifications to authenticated;

-- Step 11: Insert test data
-- ======================
insert into public.users (name, email, role, is_active) values
('Admin User', 'admin@infratrack.com', 'admin', true),
('Ahmad Sutrisno', 'ahmad.sutrisno@example.com', 'field_officer', true),
('Budi Santoso', 'budi.santoso@example.com', 'field_officer', true),
('Citra Dewi', 'citra.dewi@example.com', 'field_officer', true),
('Masyarakat User', 'citizen@infratrack.com', 'citizen', true)
on conflict (email) do nothing;

-- Insert test asset (only if not exists)
-- Note: infrastructure_assets already exists with test data from initial setup
-- If needed, uncomment below to insert additional test data:
-- insert into public.infrastructure_assets (name, category, location, condition, year_built) values
-- ('Jalan Ahmad Yani Blok A', 'road', ST_GeogFromText('POINT(106.8456 -6.2088)'), 'baik', 2020)
-- on conflict do nothing;

select 'Database setup completed successfully!' as status;
