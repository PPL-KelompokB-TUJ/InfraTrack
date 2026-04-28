-- ============================================
-- FIX: Enable User Creation in Supabase
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Drop existing policies on users table
drop policy if exists "Authenticated can select users" on public.users;
drop policy if exists "Authenticated can insert users" on public.users;
drop policy if exists "Authenticated can update users" on public.users;
drop policy if exists "Users can update themselves" on public.users;

-- 2. Drop existing policies on user_profiles table
drop policy if exists "Authenticated can select user profiles" on public.user_profiles;
drop policy if exists "Authenticated can insert user profiles" on public.user_profiles;
drop policy if exists "Authenticated can update user profiles" on public.user_profiles;

-- 3. Create permissive RLS policies for users table
create policy "Allow authenticated to select users"
  on public.users
  for select
  to authenticated
  using (true);

create policy "Allow authenticated to insert users"
  on public.users
  for insert
  to authenticated
  with check (true);

create policy "Allow authenticated to update users"
  on public.users
  for update
  to authenticated
  using (true);

-- 4. Create permissive RLS policies for user_profiles table
create policy "Allow authenticated to select user profiles"
  on public.user_profiles
  for select
  to authenticated
  using (true);

create policy "Allow authenticated to insert user_profiles"
  on public.user_profiles
  for insert
  to authenticated
  with check (true);

create policy "Allow authenticated to update user_profiles"
  on public.user_profiles
  for update
  to authenticated
  using (true);

-- 5. Verify policies are in place
select 
  tablename,
  policyname,
  cmd,
  qual,
  with_check
from pg_policies
where tablename in ('users', 'user_profiles')
order by tablename, cmd;

select 'RLS policies configured successfully!' as status;
