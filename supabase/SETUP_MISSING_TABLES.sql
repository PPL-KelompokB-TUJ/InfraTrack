-- ========================================
-- InfraTrack - Setup Missing Tables Only
-- Infrastructure_assets & damage_reports already exist
-- April 20, 2026
-- ========================================

-- Step 1: Create Users Table (Application-level, different from auth.users)
-- =======================================================================
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

-- Step 2: Create User Profiles Table
-- ==================================
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

-- Step 3: Create Maintenance Tasks Table
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

-- Step 4: Create Notifications Table
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

-- Step 5: Create Triggers for updated_at
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

-- Step 6: Create Indexes
-- ====================
create index if not exists users_email_idx on public.users(email);
create index if not exists users_role_idx on public.users(role);
create index if not exists user_profiles_user_id_idx on public.user_profiles(user_id);
create index if not exists maintenance_tasks_report_id_idx on public.maintenance_tasks(report_id);
create index if not exists maintenance_tasks_assigned_to_idx on public.maintenance_tasks(assigned_to);
create index if not exists maintenance_tasks_status_idx on public.maintenance_tasks(status);
create index if not exists notifications_user_id_idx on public.notifications(user_id);

-- Step 7: Enable RLS
-- ================
alter table public.users enable row level security;
alter table public.user_profiles enable row level security;
alter table public.maintenance_tasks enable row level security;
alter table public.notifications enable row level security;

-- Step 8: Create RLS Policies
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

-- Step 9: Grant permissions
-- =========================
grant select, insert, update, delete on public.users to authenticated;
grant select, insert, update, delete on public.user_profiles to authenticated;
grant select, insert, update, delete on public.maintenance_tasks to authenticated;
grant select, insert, update, delete on public.notifications to authenticated;

-- Step 10: Insert test data for users only
-- ========================================
insert into public.users (name, email, role, is_active) values
('Admin User', 'admin@infratrack.com', 'admin', true),
('Ahmad Sutrisno', 'ahmad.sutrisno@example.com', 'field_officer', true),
('Budi Santoso', 'budi.santoso@example.com', 'field_officer', true),
('Citra Dewi', 'citra.dewi@example.com', 'field_officer', true),
('Masyarakat User', 'citizen@infratrack.com', 'citizen', true)
on conflict (email) do nothing;

-- Step 11: Verify setup
-- ====================
select 'Setup Complete!' as status;
select count(*) as users_count from public.users;
select count(*) as maintenance_tasks_count from public.maintenance_tasks;
select count(*) as notifications_count from public.notifications;
