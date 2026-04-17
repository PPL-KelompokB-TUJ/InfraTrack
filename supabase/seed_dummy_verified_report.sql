-- Run this script in Supabase SQL Editor.
-- Purpose: ensure at least one damage report is available with status 'terverifikasi'
-- so PBI-04 maintenance assignment flow can be tested.

do $$
declare
  v_report_id uuid;
begin
  -- 1) Prefer promoting an existing pending report that has not been assigned yet.
  select dr.id
  into v_report_id
  from public.damage_reports dr
  where dr.status = 'pending'
    and not exists (
      select 1
      from public.maintenance_tasks mt
      where mt.report_id = dr.id
    )
  order by dr.created_at desc
  limit 1;

  if v_report_id is not null then
    update public.damage_reports
    set status = 'terverifikasi',
        updated_at = now()
    where id = v_report_id;
  else
    -- 2) If no eligible pending report exists, insert a dummy verified report.
    insert into public.damage_reports (
      reporter_name,
      reporter_email,
      reporter_phone,
      damage_type,
      urgency_level,
      description,
      location,
      latitude,
      longitude,
      status,
      ticket_code
    )
    values (
      'Tester InfraTrack',
      'tester.infratrack@example.com',
      '081234567890',
      'Jalan berlubang',
      'sedang',
      'Laporan dummy untuk pengujian fitur penugasan pemeliharaan (PBI-04).',
      st_setsrid(st_makepoint(106.816666, -6.200000), 4326)::geography,
      -6.200000,
      106.816666,
      'terverifikasi',
      concat('INF-TEST-', upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)))
    );
  end if;
end
$$;

-- Optional check:
select id, ticket_code, status, created_at
from public.damage_reports
where status = 'terverifikasi'
order by created_at desc
limit 5;
