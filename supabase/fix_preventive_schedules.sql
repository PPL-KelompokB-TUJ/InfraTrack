-- ============================================================
-- PBI-08 FIX: Drop and recreate preventive_schedules table
-- Run this in Supabase SQL Editor to fix missing columns
-- ============================================================

-- Drop the old table (removes any old/incompatible schema)
drop table if exists public.preventive_schedules cascade;

-- Recreate with correct schema
create table public.preventive_schedules (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.infrastructure_assets(id) on delete cascade,
  title text not null,
  description text,
  frequency_days int not null check (frequency_days > 0),
  last_done date,
  next_due date not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'cancelled', 'overdue')),
  completed_at timestamptz,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-update trigger
create or replace function public.set_preventive_schedules_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_preventive_schedules_updated_at
before update on public.preventive_schedules
for each row execute function public.set_preventive_schedules_updated_at();

-- Indexes
create index preventive_schedules_asset_id_idx on public.preventive_schedules(asset_id);
create index preventive_schedules_status_idx on public.preventive_schedules(status);
create index preventive_schedules_next_due_idx on public.preventive_schedules(next_due);

-- RLS
alter table public.preventive_schedules enable row level security;
grant select, insert, update, delete on public.preventive_schedules to authenticated;

create policy "Admin full access preventive schedules"
  on public.preventive_schedules for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
