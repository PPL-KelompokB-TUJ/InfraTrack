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

-- Trigger for task completed -> admin
create or replace function public.fn_on_task_completed()
returns trigger
security definer
language plpgsql
as $$
declare
  admin_rec record;
  v_ticket_code text;
  v_officer_name text;
  v_material_list text;
  v_material_row record;
  v_clean_notes text;
  v_biaya_lainnya text;
  v_final_message text;
begin
  -- Hanya eksekusi jika status berubah menjadi 'completed'
  if NEW.status = 'completed' and OLD.status <> 'completed' then
    select ticket_code into v_ticket_code from public.damage_reports where id = NEW.report_id;
    select name into v_officer_name from public.users where id = NEW.assigned_to;

    -- Extract "Biaya Lainnya" and Clean Notes
    v_clean_notes := COALESCE(NEW.notes, '-');
    v_biaya_lainnya := '';
    
    if v_clean_notes ~ 'Biaya Lainnya: Rp' then
      v_biaya_lainnya := substring(v_clean_notes from 'Biaya Lainnya: Rp.*$');
      v_clean_notes := regexp_replace(v_clean_notes, E'\\n*Biaya Lainnya: Rp.*$', '');
    end if;
    
    if trim(v_clean_notes) = '' then
      v_clean_notes := '-';
    end if;

    -- Get materials used
    v_material_list := '';
    for v_material_row in 
      select m.name, mu.quantity_used, m.unit, mu.total_cost, mu.notes as m_notes
      from public.material_usages mu
      join public.materials m on m.id = mu.material_id
      where mu.task_id = NEW.id
    loop
      v_material_list := v_material_list || v_material_row.name || ': ' || 
                         v_material_row.quantity_used || ' ' || v_material_row.unit || 
                         ' (Rp ' || REPLACE(to_char(v_material_row.total_cost, 'FM999G999G999'), ',', '.') || ')';
      
      if v_material_row.m_notes is not null and trim(v_material_row.m_notes) <> '' then
        v_material_list := v_material_list || ' – ' || v_material_row.m_notes;
      end if;
      
      v_material_list := v_material_list || E'\n';
    end loop;
    
    if v_material_list = '' then
      v_material_list := 'Tidak ada pemakaian material' || E'\n';
    end if;

    -- Format final message
    v_final_message := E'Pekerjaan pemeliharaan telah diselesaikan.\n\n' ||
                       E'ID Penugasan: ' || NEW.id || E'\n' ||
                       E'Petugas: ' || COALESCE(v_officer_name, 'Petugas Lapangan') || E'\n' ||
                       E'Catatan: ' || v_clean_notes || E'\n\n' ||
                       E'Ringkasan Pemakaian Material:\n' || v_material_list;
                       
    if v_biaya_lainnya <> '' then
      v_final_message := v_final_message || E'\n' || v_biaya_lainnya || E'\n';
    else
      v_final_message := v_final_message || E'\n';
    end if;
    
    v_final_message := v_final_message || E'Total Realisasi: Rp ' || COALESCE(REPLACE(to_char(NEW.actual_cost, 'FM999G999G999'), ',', '.'), '0');

    for admin_rec in 
      select id from public.users 
      where role = 'admin' and is_active = true
    loop
      insert into public.notifications (user_id, type, title, message, related_id)
      values (
        admin_rec.id,
        'task_completed',
        'Tugas Selesai: ' || COALESCE(v_ticket_code, NEW.id::text),
        v_final_message,
        NEW.id
      );
    end loop;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_on_maintenance_task_completed on public.maintenance_tasks;
drop trigger if exists trg_on_task_completed on public.maintenance_tasks;

create trigger trg_on_task_completed
after update of status on public.maintenance_tasks
for each row
execute function public.fn_on_task_completed();
