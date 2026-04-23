-- COMPLETE RLS FIX for InfraTrack - April 20, 2026
-- Run this in Supabase SQL Editor to fix all RLS issues

-- ========================================
-- 1. Fix USERS table RLS
-- ========================================
alter table public.users enable row level security;

drop policy if exists "Users can view own profile" on public.users;
drop policy if exists "Admin can manage users" on public.users;
drop policy if exists "Authenticated can view all users" on public.users;
drop policy if exists "Users can view all users" on public.users;
drop policy if exists "Authenticated users can select all users" on public.users;
drop policy if exists "Authenticated users can insert users" on public.users;
drop policy if exists "Users can update own profile" on public.users;
drop policy if exists "Anon users can select users" on public.users;

-- Users table: Allow authenticated users to SELECT (for fetching field officers)
create policy "Authenticated users can view users"
  on public.users
  for select
  to authenticated
  using (true);

-- Users table: Allow INSERT for signup
create policy "Authenticated can insert users"
  on public.users
  for insert
  to authenticated
  with check (auth.uid() = id);

-- Users table: Allow UPDATE own record
create policy "Users can update own record"
  on public.users
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ========================================
-- 2. Fix USER_PROFILES table RLS
-- ========================================
alter table public.user_profiles enable row level security;

drop policy if exists "User profiles select all" on public.user_profiles;
drop policy if exists "User profiles insert own" on public.user_profiles;
drop policy if exists "User profiles update own" on public.user_profiles;

create policy "Authenticated can select user profiles"
  on public.user_profiles
  for select
  to authenticated
  using (true);

create policy "Users can insert own profile"
  on public.user_profiles
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own profile"
  on public.user_profiles
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ========================================
-- 3. Fix MAINTENANCE_TASKS table RLS
-- ========================================
alter table public.maintenance_tasks enable row level security;

drop policy if exists "Admin full access maintenance tasks" on public.maintenance_tasks;
drop policy if exists "Dev full access maintenance tasks" on public.maintenance_tasks;
drop policy if exists "Authenticated can manage maintenance tasks" on public.maintenance_tasks;
drop policy if exists "Authenticated can select maintenance tasks" on public.maintenance_tasks;
drop policy if exists "Authenticated can insert maintenance tasks" on public.maintenance_tasks;
drop policy if exists "Authenticated can update maintenance tasks" on public.maintenance_tasks;
drop policy if exists "Authenticated can delete maintenance tasks" on public.maintenance_tasks;

-- Maintenance tasks: All operations for authenticated users
create policy "Authenticated can view maintenance tasks"
  on public.maintenance_tasks
  for select
  to authenticated
  using (true);

create policy "Authenticated can create maintenance tasks"
  on public.maintenance_tasks
  for insert
  to authenticated
  with check (true);

create policy "Authenticated can update maintenance tasks"
  on public.maintenance_tasks
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated can delete maintenance tasks"
  on public.maintenance_tasks
  for delete
  to authenticated
  using (true);

-- ========================================
-- 4. Fix DAMAGE_REPORTS table RLS
-- ========================================
alter table public.damage_reports enable row level security;

drop policy if exists "Damage reports select all" on public.damage_reports;
drop policy if exists "Damage reports insert" on public.damage_reports;
drop policy if exists "Damage reports update" on public.damage_reports;

create policy "Authenticated can view damage reports"
  on public.damage_reports
  for select
  to authenticated
  using (true);

create policy "Users can create damage reports"
  on public.damage_reports
  for insert
  to authenticated
  with check (true);

create policy "Authenticated can update damage reports"
  on public.damage_reports
  for update
  to authenticated
  using (true)
  with check (true);

-- ========================================
-- 5. Fix NOTIFICATIONS table RLS
-- ========================================
alter table public.notifications enable row level security;

drop policy if exists "Users can view own notifications" on public.notifications;
drop policy if exists "Authenticated can view notifications" on public.notifications;
drop policy if exists "Notifications insert" on public.notifications;
drop policy if exists "Notifications update own" on public.notifications;

create policy "Authenticated can view all notifications"
  on public.notifications
  for select
  to authenticated
  using (true);

create policy "Create notifications for users"
  on public.notifications
  for insert
  to authenticated
  with check (true);

create policy "Update own notifications"
  on public.notifications
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ========================================
-- VERIFICATION
-- ========================================
select 
  tablename,
  count(*) as policy_count
from pg_policies
where tablename in ('users', 'user_profiles', 'maintenance_tasks', 'damage_reports', 'notifications')
group by tablename
order by tablename;

select 'All RLS policies have been updated successfully!' as status;
