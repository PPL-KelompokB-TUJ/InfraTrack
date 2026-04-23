-- Ensure field_officers_view exists (PBI-04 fix)
-- This script creates the view if it doesn't exist
-- Run this in Supabase SQL Editor if you get "view not found" errors

-- Ensure tables exist first
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

-- Create or replace the view
create or replace view public.field_officers_view
with (security_invoker = true) as
select 
  u.id,
  u.name,
  u.email,
  coalesce(up.specialization, '-') as specialization,
  coalesce(up.work_area, '-') as work_area,
  coalesce(up.phone, '-') as phone,
  u.is_active
from public.users u
left join public.user_profiles up on u.id = up.user_id
where u.role = 'field_officer' and u.is_active = true;

-- Grant permissions
grant select on public.field_officers_view to authenticated;

-- Success message
select 'View field_officers_view created/refreshed successfully' as status;
