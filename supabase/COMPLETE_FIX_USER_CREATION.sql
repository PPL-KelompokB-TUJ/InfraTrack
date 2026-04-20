-- ============================================
-- COMPLETE FIX: Enable User Creation
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Drop ALL existing policies on users table
drop policy if exists "Authenticated can view users" on public.users;
drop policy if exists "Users can update own record" on public.users;
drop policy if exists "Authenticated can insert users" on public.users;
drop policy if exists "Allow authenticated to select users" on public.users;
drop policy if exists "Allow authenticated to insert users" on public.users;
drop policy if exists "Allow authenticated to update users" on public.users;

-- Step 2: Drop ALL existing policies on user_profiles table
drop policy if exists "Authenticated can view user profiles" on public.user_profiles;
drop policy if exists "Users can manage own profile" on public.user_profiles;
drop policy if exists "Authenticated can insert user profiles" on public.user_profiles;
drop policy if exists "Allow authenticated to select user profiles" on public.user_profiles;
drop policy if exists "Allow authenticated to insert user_profiles" on public.user_profiles;
drop policy if exists "Allow authenticated to update user_profiles" on public.user_profiles;

-- Step 3: Recreate comprehensive policies for users table
-- Allow everyone to select
create policy "users_select_policy"
  on public.users
  for select
  using (true);

-- Allow authenticated users to insert
create policy "users_insert_policy"
  on public.users
  for insert
  to authenticated
  with check (true);

-- Allow authenticated users to update
create policy "users_update_policy"
  on public.users
  for update
  to authenticated
  using (true);

-- Step 4: Recreate comprehensive policies for user_profiles table
-- Allow everyone to select
create policy "user_profiles_select_policy"
  on public.user_profiles
  for select
  using (true);

-- Allow authenticated users to insert
create policy "user_profiles_insert_policy"
  on public.user_profiles
  for insert
  to authenticated
  with check (true);

-- Allow authenticated users to update
create policy "user_profiles_update_policy"
  on public.user_profiles
  for update
  to authenticated
  using (true);

-- Step 5: Verify policies
select 
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive
from pg_policies
where tablename in ('users', 'user_profiles')
order by tablename, cmd;

select 'FIXED! RLS policies now allow INSERT for authenticated users.' as status;
