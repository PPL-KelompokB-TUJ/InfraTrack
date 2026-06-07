-- 1) Re-enable RLS on the notifications table
alter table public.notifications enable row level security;

-- 2) Drop existing policies if any
drop policy if exists "Admin full access notifications" on public.notifications;
drop policy if exists "Authenticated can view notifications" on public.notifications;
drop policy if exists "Create notifications" on public.notifications;
drop policy if exists "Update own notifications" on public.notifications;
drop policy if exists "Users can view own notifications" on public.notifications;
drop policy if exists "Users can update own notifications" on public.notifications;

-- 3) Create RLS Policies
-- Policy for Admin: Full access (select, insert, update, delete)
create policy "Admin full access notifications"
  on public.notifications
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Policy for User: Only view their own notifications
create policy "Users can view own notifications"
  on public.notifications
  for select
  to authenticated
  using (user_id = auth.uid());

-- Policy for User: Only update is_read status of their own notifications
create policy "Users can update own notifications"
  on public.notifications
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Policy to allow inserts: Keep it to authenticated (triggers run in SECURITY DEFINER, so they bypass RLS)
create policy "Allow insert notifications"
  on public.notifications
  for insert
  to authenticated
  with check (true);

-- 4) Create Triggers for Automated Notification Generation

-- Function to handle damage report notifications for admins
create or replace function public.fn_on_damage_report_inserted()
returns trigger
security definer
language plpgsql
as $$
declare
  admin_rec record;
begin
  -- For each active admin, create a notification
  for admin_rec in 
    select id from public.users 
    where role = 'admin' and is_active = true
  loop
    insert into public.notifications (user_id, type, title, message, related_id)
    values (
      admin_rec.id,
      'new_report',
      'Laporan Baru Masuk',
      'Laporan kerusakan baru dengan kode tiket ' || NEW.ticket_code || ' telah masuk.',
      NEW.id
    );
  end loop;
  return NEW;
end;
$$;

-- Bind trigger to damage_reports
drop trigger if exists trg_on_damage_report_inserted on public.damage_reports;
create trigger trg_on_damage_report_inserted
after insert on public.damage_reports
for each row
when (NEW.status = 'pending')
execute function public.fn_on_damage_report_inserted();


-- Function to handle maintenance task notifications for field officers
create or replace function public.fn_on_maintenance_task_assigned()
returns trigger
security definer
language plpgsql
as $$
begin
  -- If assigned_to is set, send notification
  if NEW.assigned_to is not null then
    insert into public.notifications (user_id, type, title, message, related_id)
    values (
      NEW.assigned_to,
      'maintenance_assigned',
      'Penugasan Pemeliharaan Baru',
      'Anda telah ditugaskan untuk pekerjaan pemeliharaan dengan estimasi tanggal ' || to_char(NEW.scheduled_date, 'DD/MM/YYYY'),
      NEW.id
    );
  end if;
  return NEW;
end;
$$;

-- Bind trigger to maintenance_tasks
drop trigger if exists trg_on_maintenance_task_assigned on public.maintenance_tasks;
create trigger trg_on_maintenance_task_assigned
after insert or update of assigned_to, scheduled_date on public.maintenance_tasks
for each row
when (
  (TG_OP = 'INSERT' and NEW.assigned_to is not null) or
  (TG_OP = 'UPDATE' and NEW.assigned_to is not null and (
    OLD.assigned_to is distinct from NEW.assigned_to or
    OLD.scheduled_date is distinct from NEW.scheduled_date
  ))
)
execute function public.fn_on_maintenance_task_assigned();
