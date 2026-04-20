-- Run this script in Supabase SQL Editor
-- Creates maintenance_logs table for tracking task progress

create table if not exists public.maintenance_logs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.maintenance_tasks(id) on delete cascade,
  officer_id uuid not null references public.users(id) on delete cascade,
  status text not null check (status in ('started', 'in_progress', 'completed')),
  notes text,
  photo_url text,
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create updated_at trigger for maintenance_logs
create or replace function public.set_maintenance_logs_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_maintenance_logs_updated_at on public.maintenance_logs;

create trigger trg_maintenance_logs_updated_at
before update on public.maintenance_logs
for each row
execute function public.set_maintenance_logs_updated_at_timestamp();

-- Create indexes for better query performance
create index if not exists maintenance_logs_task_id_idx on public.maintenance_logs(task_id);
create index if not exists maintenance_logs_officer_id_idx on public.maintenance_logs(officer_id);
create index if not exists maintenance_logs_logged_at_idx on public.maintenance_logs(logged_at);

-- Enable RLS
alter table public.maintenance_logs enable row level security;

-- RLS Policies for maintenance_logs
drop policy if exists "Admin and assigned officer can view logs" on public.maintenance_logs;
drop policy if exists "Admin and assigned officer can create logs" on public.maintenance_logs;
drop policy if exists "Admin and assigned officer can update logs" on public.maintenance_logs;

create policy "Admin and assigned officer can view logs"
  on public.maintenance_logs
  for select
  to authenticated
  using (
    public.is_admin() or
    officer_id = auth.uid()
  );

create policy "Admin and assigned officer can create logs"
  on public.maintenance_logs
  for insert
  to authenticated
  with check (
    public.is_admin() or
    officer_id = auth.uid()
  );

create policy "Admin and assigned officer can update logs"
  on public.maintenance_logs
  for update
  to authenticated
  using (
    public.is_admin() or
    officer_id = auth.uid()
  )
  with check (
    public.is_admin() or
    officer_id = auth.uid()
  );

-- Grant permissions
grant select, insert, update on public.maintenance_logs to authenticated;

-- Create storage bucket for maintenance progress photos if not exists
insert into storage.buckets (id, name, public)
values ('maintenance-progress-photos', 'maintenance-progress-photos', true)
on conflict (id) do nothing;

-- Set up storage policies for maintenance progress photos
create policy "Public read maintenance progress photos"
  on storage.objects
  for select
  to public
  using (bucket_id = 'maintenance-progress-photos');

create policy "Authenticated upload maintenance progress photos"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'maintenance-progress-photos' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their maintenance progress photos"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'maintenance-progress-photos' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their maintenance progress photos"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'maintenance-progress-photos' and
    auth.uid()::text = (storage.foldername(name))[1]
  );
