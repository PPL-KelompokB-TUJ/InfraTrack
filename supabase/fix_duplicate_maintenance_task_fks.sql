-- Fix duplicate foreign keys on public.maintenance_tasks
-- Root cause: PostgREST relationship embedding becomes ambiguous when more than one FK exists
-- for the same source column to the same target table.

begin;

-- Keep canonical constraints expected by current app code.
alter table public.maintenance_tasks
  drop constraint if exists fk_maintenance_tasks_report_id,
  drop constraint if exists fk_maintenance_tasks_asset_id;

-- Ensure canonical constraints exist with expected behavior.
alter table public.maintenance_tasks
  drop constraint if exists maintenance_tasks_report_id_fkey,
  add constraint maintenance_tasks_report_id_fkey
    foreign key (report_id) references public.damage_reports(id) on delete set null;

alter table public.maintenance_tasks
  drop constraint if exists maintenance_tasks_asset_id_fkey,
  add constraint maintenance_tasks_asset_id_fkey
    foreign key (asset_id) references public.infrastructure_assets(id) on delete set null;

commit;

-- Verify there is only one FK per relationship.
select
  conname,
  conrelid::regclass as table_name,
  confrelid::regclass as referenced_table,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.maintenance_tasks'::regclass
  and contype = 'f'
order by conname;
