-- Fix: Add missing INSERT policy for users table
-- This allows creating new field officers

-- Drop old INSERT policy if exists
drop policy if exists "Authenticated can insert users" on public.users;

-- Add INSERT policy - allow authenticated users to insert
create policy "Authenticated can insert users"
  on public.users
  for insert
  to authenticated
  with check (true);

-- Also add INSERT policy for user_profiles
drop policy if exists "Authenticated can insert user profiles" on public.user_profiles;
create policy "Authenticated can insert user profiles"
  on public.user_profiles
  for insert
  to authenticated
  with check (true);

-- Verify INSERT policy exists
select 
  tablename,
  policyname,
  cmd
from pg_policies
where tablename = 'users' and cmd = 'INSERT'
order by policyname;

select 'INSERT policies added successfully for users and user_profiles!' as status;
