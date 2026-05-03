-- ============================================================
-- PBI-08: Preventive Maintenance Schedules
-- Run this script in Supabase SQL Editor
-- ============================================================

-- 1) Create the preventive_schedules table
create table if not exists public.preventive_schedules (
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

-- 2) Auto-update updated_at trigger
create or replace function public.set_preventive_schedules_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_preventive_schedules_updated_at on public.preventive_schedules;

create trigger trg_preventive_schedules_updated_at
before update on public.preventive_schedules
for each row
execute function public.set_preventive_schedules_updated_at();

-- 3) Indexes for common queries
create index if not exists preventive_schedules_asset_id_idx
  on public.preventive_schedules(asset_id);
create index if not exists preventive_schedules_status_idx
  on public.preventive_schedules(status);
create index if not exists preventive_schedules_next_due_idx
  on public.preventive_schedules(next_due);
create index if not exists preventive_schedules_created_by_idx
  on public.preventive_schedules(created_by);

-- 4) Enable RLS
alter table public.preventive_schedules enable row level security;

grant select, insert, update, delete on public.preventive_schedules to authenticated;

drop policy if exists "Admin full access preventive schedules" on public.preventive_schedules;

create policy "Admin full access preventive schedules"
  on public.preventive_schedules
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 5) Function: auto-mark overdue schedules (can be called by pg_cron or Edge Function)
create or replace function public.mark_overdue_preventive_schedules()
returns void
language plpgsql
as $$
begin
  update public.preventive_schedules
  set status = 'overdue'
  where status = 'scheduled'
    and next_due < current_date;
end;
$$;

grant execute on function public.mark_overdue_preventive_schedules() to authenticated;

-- 6) Function: send reminder notifications (H-3 and H-1)
--    Creates notifications for all admin users when schedules are due soon
create or replace function public.send_preventive_schedule_reminders()
returns void
language plpgsql
as $$
declare
  schedule_record record;
  admin_record record;
  reminder_label text;
begin
  -- First mark overdue
  perform public.mark_overdue_preventive_schedules();

  -- Process H-3 and H-1 reminders
  for schedule_record in
    select ps.id, ps.title, ps.next_due, ia.name as asset_name
    from public.preventive_schedules ps
    join public.infrastructure_assets ia on ia.id = ps.asset_id
    where ps.status = 'scheduled'
      and (ps.next_due = current_date + interval '3 days'
           or ps.next_due = current_date + interval '1 day')
  loop
    -- Determine reminder label
    if schedule_record.next_due = current_date + interval '1 day' then
      reminder_label := 'H-1';
    else
      reminder_label := 'H-3';
    end if;

    -- Send to all admins
    for admin_record in
      select id from public.users
      where role = 'admin' and is_active = true
    loop
      -- Avoid duplicate notifications for the same schedule + day
      if not exists (
        select 1 from public.notifications
        where related_id = schedule_record.id
          and user_id = admin_record.id
          and type = 'preventive_reminder'
          and created_at::date = current_date
      ) then
        insert into public.notifications (user_id, type, title, message, related_id)
        values (
          admin_record.id,
          'preventive_reminder',
          'Reminder Jadwal Preventif (' || reminder_label || ')',
          'Jadwal pemeliharaan "' || schedule_record.title || '" untuk aset ' || schedule_record.asset_name || ' akan jatuh tempo pada ' || to_char(schedule_record.next_due, 'DD Mon YYYY') || '.',
          schedule_record.id
        );
      end if;
    end loop;
  end loop;
end;
$$;

grant execute on function public.send_preventive_schedule_reminders() to authenticated;

-- 7) Optional: Set up pg_cron to run daily at 07:00 WIB (00:00 UTC)
--    Uncomment the following if pg_cron extension is available:
-- select cron.schedule(
--   'preventive-schedule-reminders',
--   '0 0 * * *',  -- 00:00 UTC = 07:00 WIB
--   $$select public.send_preventive_schedule_reminders()$$
-- );
