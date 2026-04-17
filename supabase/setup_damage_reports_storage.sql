-- Run this script in Supabase SQL Editor

-- Create bucket if it does not exist.
-- Keep this bucket public for MVP so uploaded photos can be displayed directly.
insert into storage.buckets (id, name, public)
values ('damage-reports', 'damage-reports', true)
on conflict (id) do update set public = excluded.public;

alter table if exists storage.objects enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "Dev read photos damage-reports" on storage.objects;
drop policy if exists "Public read photos damage-reports" on storage.objects;
create policy "Public read photos damage-reports"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'damage-reports');

drop policy if exists "Dev upload photos damage-reports" on storage.objects;
drop policy if exists "Public upload photos damage-reports" on storage.objects;
create policy "Public upload photos damage-reports"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'damage-reports');

drop policy if exists "Dev update photos damage-reports" on storage.objects;
drop policy if exists "Admin update photos damage-reports" on storage.objects;
create policy "Admin update photos damage-reports"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'damage-reports' and public.is_admin())
  with check (bucket_id = 'damage-reports' and public.is_admin());

drop policy if exists "Dev delete photos damage-reports" on storage.objects;
drop policy if exists "Admin delete photos damage-reports" on storage.objects;
create policy "Admin delete photos damage-reports"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'damage-reports' and public.is_admin());
