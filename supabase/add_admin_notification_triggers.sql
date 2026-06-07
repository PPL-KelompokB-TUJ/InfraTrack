-- ============================================================
-- PBI-08: Add Administrative Notification Triggers
-- Triggers for:
-- 1. Jadwal preventif jatuh tempo (preventive schedule overdue)
-- 2. Task selesai oleh petugas (maintenance task completed)
-- ============================================================

-- 1) Function & Trigger for Preventive Schedule Overdue
create or replace function public.fn_on_preventive_schedule_overdue()
returns trigger
security definer
language plpgsql
as $$
declare
  admin_rec record;
  v_asset_name text;
begin
  -- Get the asset name for the message
  select name into v_asset_name from public.infrastructure_assets where id = NEW.asset_id;

  for admin_rec in 
    select id from public.users 
    where role = 'admin' and is_active = true
  loop
    insert into public.notifications (user_id, type, title, message, related_id)
    values (
      admin_rec.id,
      'preventive_overdue',
      'Jadwal Preventif Jatuh Tempo',
      'Jadwal preventif "' || NEW.title || '" untuk aset ' || coalesce(v_asset_name, 'terkait') || ' telah melewati tanggal jatuh tempo (' || to_char(NEW.next_due, 'DD/MM/YYYY') || ').',
      NEW.id
    );
  end loop;
  return NEW;
end;
$$;

drop trigger if exists trg_on_preventive_schedule_overdue on public.preventive_schedules;
create trigger trg_on_preventive_schedule_overdue
after update of status on public.preventive_schedules
for each row
when (NEW.status = 'overdue' and OLD.status <> 'overdue')
execute function public.fn_on_preventive_schedule_overdue();


create or replace function public.fn_on_maintenance_task_completed()
returns trigger
security definer
language plpgsql
as $$
declare
  v_ticket_code text;
  v_officer_name text;
begin
  -- Fetch additional details for a better notification message
  select ticket_code into v_ticket_code from public.damage_reports where id = NEW.report_id;
  select name into v_officer_name from public.users where id = NEW.assigned_to;

  -- Send notification only to the admin who assigned the task
  if NEW.assigned_by is not null then
    insert into public.notifications (user_id, type, title, message, related_id)
    values (
      NEW.assigned_by,
      'task_completed',
      'Tugas Selesai oleh Petugas',
      'Tugas pemeliharaan untuk laporan ' || coalesce(v_ticket_code, 'dengan tiket #' || NEW.report_id) || ' telah diselesaikan oleh ' || coalesce(v_officer_name, 'petugas') || '.',
      NEW.id
    );
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_on_maintenance_task_completed on public.maintenance_tasks;
create trigger trg_on_maintenance_task_completed
after update of status on public.maintenance_tasks
for each row
when (NEW.status = 'completed' and OLD.status <> 'completed')
execute function public.fn_on_maintenance_task_completed();

select 'Administrative notification triggers created successfully!' as status;
