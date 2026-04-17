-- ============================================
-- Create Users & User Profiles Tables
-- Run this in Supabase SQL Editor
-- ============================================

-- Create users table (application-level users)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password text,
  role text not null check (role in ('admin', 'field_officer', 'citizen')),
  is_active boolean not null default true,
  profile_photo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create user_profiles table for additional info
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

-- Create updated_at trigger for users
create or replace function public.set_users_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_users_updated_at on public.users;

create trigger trg_users_updated_at
before update on public.users
for each row
execute function public.set_users_updated_at_timestamp();

-- Create updated_at trigger for user_profiles
create or replace function public.set_user_profiles_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_profiles_updated_at on public.user_profiles;

create trigger trg_user_profiles_updated_at
before update on public.user_profiles
for each row
execute function public.set_user_profiles_updated_at_timestamp();

-- Create indexes
create index if not exists users_email_idx on public.users(email);
create index if not exists users_role_idx on public.users(role);
create index if not exists users_is_active_idx on public.users(is_active);
create index if not exists user_profiles_user_id_idx on public.user_profiles(user_id);

-- Enable RLS
alter table public.users enable row level security;
alter table public.user_profiles enable row level security;

-- Insert test data for field officers
insert into public.users (name, email, role, is_active) values
('Ahmad Sutrisno', 'ahmad.sutrisno@example.com', 'field_officer', true),
('Budi Santoso', 'budi.santoso@example.com', 'field_officer', true),
('Citra Dewi', 'citra.dewi@example.com', 'field_officer', true),
('Dewi Lestari', 'dewi.lestari@example.com', 'admin', true)
on conflict (email) do nothing;

-- Insert profiles for field officers
insert into public.user_profiles (user_id, specialization, work_area, phone)
select id, 'Jalan & Drainase', 'Jakarta Selatan', '081234567890'
from public.users where name = 'Ahmad Sutrisno' and not exists (
  select 1 from public.user_profiles where user_id = public.users.id
);

insert into public.user_profiles (user_id, specialization, work_area, phone)
select id, 'Jembatan & Bangunan', 'Jakarta Pusat', '082345678901'
from public.users where name = 'Budi Santoso' and not exists (
  select 1 from public.user_profiles where user_id = public.users.id
);

insert into public.user_profiles (user_id, specialization, work_area, phone)
select id, 'Fasilitas Umum', 'Jakarta Utara', '083456789012'
from public.users where name = 'Citra Dewi' and not exists (
  select 1 from public.user_profiles where user_id = public.users.id
);

-- Create view for easier field officer queries
create or replace view public.field_officers_view as
select 
  u.id,
  u.name,
  u.email,
  up.specialization,
  up.work_area,
  up.phone,
  u.is_active
from public.users u
left join public.user_profiles up on u.id = up.user_id
where u.role = 'field_officer' and u.is_active = true;
