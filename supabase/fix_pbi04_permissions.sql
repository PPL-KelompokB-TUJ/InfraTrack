-- Run this script in Supabase SQL Editor.
-- Fixes permission/RLS issues for PBI-04 (maintenance assignment).

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

grant execute on function public.is_admin() to authenticated;

-- Minimal table privileges for PostgREST roles.
grant select on public.users to authenticated;
grant select on public.user_profiles to authenticated;
grant select on public.field_officers_view to authenticated;

grant select, insert, update, delete on public.maintenance_tasks to authenticated;
grant select, insert, update, delete on public.notifications to authenticated;

-- Users table policies.
alter table public.users enable row level security;

drop policy if exists "Public read active field officers users" on public.users;
drop policy if exists "Admin read active field officers users" on public.users;
create policy "Admin read active field officers users"
  on public.users
  for select
  to authenticated
  using (public.is_admin() and role = 'field_officer' and is_active = true);

drop policy if exists "Admin manage users" on public.users;
create policy "Admin manage users"
  on public.users
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- User profiles policies.
alter table public.user_profiles enable row level security;

drop policy if exists "Public read active field officer profiles" on public.user_profiles;
drop policy if exists "Admin read active field officer profiles" on public.user_profiles;
create policy "Admin read active field officer profiles"
  on public.user_profiles
  for select
  to authenticated
  using (
    public.is_admin() and
    exists (
      select 1
      from public.users u
      where u.id = public.user_profiles.user_id
        and u.role = 'field_officer'
        and u.is_active = true
    )
  );

drop policy if exists "Admin manage user profiles" on public.user_profiles;
create policy "Admin manage user profiles"
  on public.user_profiles
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Maintenance tasks policies.
alter table public.maintenance_tasks enable row level security;

drop policy if exists "Admin full access maintenance tasks" on public.maintenance_tasks;
drop policy if exists "Dev full access maintenance tasks" on public.maintenance_tasks;
create policy "Admin full access maintenance tasks"
  on public.maintenance_tasks
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Notifications policies.
alter table public.notifications enable row level security;

drop policy if exists "Admin full access notifications" on public.notifications;
drop policy if exists "Dev full access notifications" on public.notifications;
create policy "Admin full access notifications"
  on public.notifications
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
