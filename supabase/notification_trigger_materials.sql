-- Trigger for new material usages added -> admin
create or replace function public.fn_on_material_usages_added()
returns trigger
security definer
language plpgsql
as $$
declare
  admin_rec record;
  v_task_id uuid;
  v_ticket_code text;
  v_officer_name text;
  v_task_status text;
  v_task_notes text;
  v_actual_cost numeric;
  v_material_list text;
  v_material_row record;
  v_status_label text;
  v_clean_notes text;
begin
  -- Get the task_id from the first row of new_table
  select task_id into v_task_id from new_table limit 1;
  
  if v_task_id is null then
    return null;
  end if;

  -- Get task details
  select 
    t.status, 
    t.notes, 
    t.actual_cost, 
    u.name, 
    r.ticket_code 
  into 
    v_task_status, 
    v_task_notes, 
    v_actual_cost, 
    v_officer_name, 
    v_ticket_code
  from public.maintenance_tasks t
  left join public.users u on u.id = t.assigned_to
  left join public.damage_reports r on r.id = t.report_id
  where t.id = v_task_id;

  -- Format status label
  if v_task_status = 'pending' then v_status_label := 'Menunggu';
  elsif v_task_status = 'assigned' then v_status_label := 'Ditugaskan';
  elsif v_task_status = 'in_progress' then v_status_label := 'Sedang Dikerjakan';
  elsif v_task_status = 'completed' then v_status_label := 'Selesai';
  elsif v_task_status = 'cancelled' then v_status_label := 'Dibatalkan';
  else v_status_label := v_task_status;
  end if;

  -- Clean notes from Biaya Lainnya if exists
  v_clean_notes := COALESCE(v_task_notes, '-');
  if v_clean_notes ~ 'Biaya Lainnya: Rp' then
    v_clean_notes := regexp_replace(v_clean_notes, E'\\n*Biaya Lainnya: Rp.*$', '');
  end if;
  if trim(v_clean_notes) = '' then v_clean_notes := '-'; end if;

  -- Aggregate materials from new_table
  v_material_list := '';
  for v_material_row in 
    select m.name, nt.quantity_used, m.unit, nt.total_cost, nt.notes as m_notes
    from new_table nt
    join public.materials m on m.id = nt.material_id
  loop
    v_material_list := v_material_list || v_material_row.name || ': ' || 
                       v_material_row.quantity_used || ' ' || v_material_row.unit || 
                       ' (Rp ' || REPLACE(to_char(v_material_row.total_cost, 'FM999G999G999'), ',', '.') || ')';
    
    if v_material_row.m_notes is not null and trim(v_material_row.m_notes) <> '' then
      v_material_list := v_material_list || ' – ' || v_material_row.m_notes;
    end if;
    
    v_material_list := v_material_list || E'\n';
  end loop;

  for admin_rec in 
    select id from public.users 
    where role = 'admin' and is_active = true
  loop
    insert into public.notifications (user_id, type, title, message, related_id)
    values (
      admin_rec.id,
      'material_added',
      'Material Ditambahkan: ' || COALESCE(v_ticket_code, v_task_id::text),
      E'Petugas menambahkan pemakaian material untuk pekerjaan yang sedang dikerjakan.\n\n' ||
      E'ID Penugasan: ' || v_task_id || E'\n' ||
      E'Petugas: ' || COALESCE(v_officer_name, 'Petugas Lapangan') || E'\n' ||
      E'Status Pekerjaan: ' || v_status_label || E'\n' ||
      E'Catatan Petugas: ' || v_clean_notes || E'\n\n' ||
      E'Pemakaian Material (baru ditambahkan):\n' || v_material_list || E'\n' ||
      E'Total Realisasi Sementara: Rp ' || COALESCE(REPLACE(to_char(v_actual_cost, 'FM999G999G999'), ',', '.'), '0'),
      v_task_id
    );
  end loop;
  
  return null;
end;
$$;

drop trigger if exists trg_on_material_usages_added on public.material_usages;

create trigger trg_on_material_usages_added
after insert on public.material_usages
referencing new table as new_table
for each statement
execute function public.fn_on_material_usages_added();
