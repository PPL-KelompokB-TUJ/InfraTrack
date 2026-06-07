-- Trigger for new damage report -> admin
create or replace function public.fn_on_new_damage_report()
returns trigger
security definer
language plpgsql
as $$
declare
  admin_rec record;
begin
  for admin_rec in 
    select id from public.users 
    where role = 'admin' and is_active = true
  loop
    insert into public.notifications (user_id, type, title, message, related_id)
    values (
      admin_rec.id,
      'new_report',
      'Laporan Baru: ' || NEW.ticket_code,
      E'ID Laporan   : ' || NEW.ticket_code || E'\n' ||
      'Dibuat oleh  : ' || COALESCE(NEW.reporter_name, 'Sistem') || E'\n' ||
      'Waktu lapor  : ' || TO_CHAR(NEW.created_at, 'DD/MM/YYYY HH24:MI') || E'\n\n' ||
      'Urgensi      : ' || COALESCE(NEW.urgency_level, '-') || E'\n' ||
      'Deskripsi    : ' || COALESCE(NEW.description, '-'),
      NEW.id
    );
  end loop;
  return NEW;
end;
$$;

-- Drop all known conflicting old triggers if they exist
drop trigger if exists trg_on_damage_report_inserted on public.damage_reports;
drop trigger if exists trg_notify_admin_on_damage_report on public.damage_reports;
drop trigger if exists trg_notify_admin_on_new_report on public.damage_reports;
drop trigger if exists on_damage_report_created on public.damage_reports;
drop trigger if exists notify_admin_new_report on public.damage_reports;
drop trigger if exists trg_on_new_damage_report on public.damage_reports;
create trigger trg_on_new_damage_report
after insert on public.damage_reports
for each row
execute function public.fn_on_new_damage_report();

-- Trigger for new task assignment -> field officer
create or replace function public.fn_on_task_assigned()
returns trigger
security definer
language plpgsql
as $$
begin
  if NEW.assigned_to is not null and (TG_OP = 'INSERT' or OLD.assigned_to is distinct from NEW.assigned_to) then
    insert into public.notifications (user_id, type, title, message, related_id)
    values (
      NEW.assigned_to,
      'task_assigned',
      'Penugasan Pemeliharaan Baru',
      E'ID Penugasan : ' || NEW.id || E'\n' ||
      'Jadwal       : ' || TO_CHAR(NEW.scheduled_date, 'DD/MM/YYYY') || E'\n' ||
      'Estimasi     : Rp' || COALESCE(NEW.estimated_cost::text, '0') || E'\n\n' ||
      'Instruksi    : ' || COALESCE(NEW.instructions, '-'),
      NEW.id
    );
  end if;
  return NEW;
end;
$$;

-- Drop all known conflicting old triggers if they exist
drop trigger if exists trg_on_maintenance_task_assigned on public.maintenance_tasks;
drop trigger if exists trg_notify_officer_on_task_assigned on public.maintenance_tasks;
drop trigger if exists notify_officer_task_assigned on public.maintenance_tasks;
drop trigger if exists trg_on_task_assigned on public.maintenance_tasks;
create trigger trg_on_task_assigned
after insert or update of assigned_to on public.maintenance_tasks
for each row
execute function public.fn_on_task_assigned();
