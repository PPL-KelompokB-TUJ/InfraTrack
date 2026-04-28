-- Fix RLS policies for users table to allow SELECT access
-- This is needed for fetching field officers

-- First, make sure RLS is enabled
alter table public.users enable row level security;

-- Drop existing policies to rebuild
drop policy if exists "Users can view own profile" on public.users;
drop policy if exists "Admin can manage users" on public.users;
drop policy if exists "Authenticated can view all users" on public.users;
drop policy if exists "Users can view all users" on public.users;

-- Create permissive SELECT policy for authenticated users
-- This allows anyone logged in to see all users
create policy "Authenticated users can select all users"
  on public.users
  for select
  to authenticated
  using (true);

-- Create INSERT policy for authenticated users (for sign up)
create policy "Authenticated users can insert users"
  on public.users
  for insert
  to authenticated
  with check (auth.uid() = id);

-- Create UPDATE policy for authenticated users (update own record)
create policy "Users can update own profile"
  on public.users
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Allow anon users to view (for public info if needed)
drop policy if exists "Anon users can select users" on public.users;
create policy "Anon users can select users"
  on public.users
  for select
  to anon
  using (true);

-- Verify all policies
select 
  tablename,
  policyname,
  cmd,
  qual,
  with_check
from pg_policies
where tablename = 'users'
order by policyname;

select 'Users table RLS policies updated successfully!' as status;
