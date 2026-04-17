-- Run this script in Supabase SQL Editor
-- Creates maintenance_tasks table and related setup

create table if not exists public.maintenance_tasks (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.damage_reports(id) on delete set null,
  asset_id uuid references public.infrastructure_assets(id) on delete set null,
  assigned_to uuid references public.users(id) on delete set null,
  assigned_by uuid references public.users(id) on delete set null,
  scheduled_date timestamp not null,
  estimated_cost decimal(12, 2),
  status text not null default 'pending' check (status in ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
  instructions text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create updated_at trigger
create or replace function public.set_maintenance_tasks_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_maintenance_tasks_updated_at on public.maintenance_tasks;

create trigger trg_maintenance_tasks_updated_at
before update on public.maintenance_tasks
for each row
execute function public.set_maintenance_tasks_updated_at_timestamp();

-- Create indexes for better query performance
create index if not exists maintenance_tasks_report_id_idx on public.maintenance_tasks(report_id);
create index if not exists maintenance_tasks_asset_id_idx on public.maintenance_tasks(asset_id);
create index if not exists maintenance_tasks_assigned_to_idx on public.maintenance_tasks(assigned_to);
create index if not exists maintenance_tasks_status_idx on public.maintenance_tasks(status);
create index if not exists maintenance_tasks_scheduled_date_idx on public.maintenance_tasks(scheduled_date);

-- Enable RLS
alter table public.maintenance_tasks enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

grant execute on function public.is_admin() to anon, authenticated;

grant select, insert, update, delete on public.maintenance_tasks to anon, authenticated;

drop policy if exists "Admin full access maintenance tasks" on public.maintenance_tasks;
drop policy if exists "Dev full access maintenance tasks" on public.maintenance_tasks;
create policy "Dev full access maintenance tasks"
  on public.maintenance_tasks
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- Create notifications table if not exists
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

-- Create notification trigger
create or replace function public.set_notifications_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_notifications_updated_at on public.notifications;

create trigger trg_notifications_updated_at
before update on public.notifications
for each row
execute function public.set_notifications_updated_at_timestamp();

-- Create indexes for notifications
create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists notifications_is_read_idx on public.notifications(is_read);
create index if not exists notifications_created_at_idx on public.notifications(created_at);

-- Enable RLS
alter table public.notifications enable row level security;

grant select, insert, update, delete on public.notifications to anon, authenticated;

drop policy if exists "Admin full access notifications" on public.notifications;
drop policy if exists "Dev full access notifications" on public.notifications;
create policy "Dev full access notifications"
  on public.notifications
  for all
  to anon, authenticated
  using (true)
  with check (true);
