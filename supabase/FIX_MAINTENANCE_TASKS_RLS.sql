-- Fix RLS policies for maintenance_tasks to allow delete
-- Run this in Supabase SQL Editor if delete is not working

-- Make sure the function exists
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

grant execute on function public.is_admin() to authenticated;

-- Drop old policies
drop policy if exists "Admin full access maintenance tasks" on public.maintenance_tasks;
drop policy if exists "Dev full access maintenance tasks" on public.maintenance_tasks;
drop policy if exists "Authenticated can manage maintenance tasks" on public.maintenance_tasks;
drop policy if exists "Authenticated can select maintenance tasks" on public.maintenance_tasks;
drop policy if exists "Authenticated can insert maintenance tasks" on public.maintenance_tasks;
drop policy if exists "Authenticated can update maintenance tasks" on public.maintenance_tasks;
drop policy if exists "Authenticated can delete maintenance tasks" on public.maintenance_tasks;

-- Create separate policies for better control
-- SELECT - authenticated users can see all tasks
create policy "Authenticated can select maintenance tasks"
  on public.maintenance_tasks
  for select
  to authenticated
  using (true);

-- INSERT - authenticated users can create tasks
create policy "Authenticated can insert maintenance tasks"
  on public.maintenance_tasks
  for insert
  to authenticated
  with check (true);

-- UPDATE - authenticated users can update tasks
create policy "Authenticated can update maintenance tasks"
  on public.maintenance_tasks
  for update
  to authenticated
  using (true)
  with check (true);

-- DELETE - authenticated users can delete tasks
create policy "Authenticated can delete maintenance tasks"
  on public.maintenance_tasks
  for delete
  to authenticated
  using (true);

-- Verify policies
select 
  tablename,
  policyname,
  cmd,
  qual,
  with_check
from pg_policies
where tablename = 'maintenance_tasks'
order by policyname;

select 'RLS policies updated successfully for maintenance_tasks' as status;
