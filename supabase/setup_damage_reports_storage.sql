-- Run this script in Supabase SQL Editor

-- Create bucket if it does not exist.
-- Keep this bucket public for MVP so uploaded photos can be displayed directly.
insert into storage.buckets (id, name, public)
values ('damage-reports', 'damage-reports', true)
on conflict (id) do update set public = excluded.public;

alter table if exists storage.objects enable row level security;

-- Development-friendly policies for public reporting flow.
drop policy if exists "Dev read photos damage-reports" on storage.objects;
create policy "Dev read photos damage-reports"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'damage-reports');

drop policy if exists "Dev upload photos damage-reports" on storage.objects;
create policy "Dev upload photos damage-reports"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'damage-reports');

drop policy if exists "Dev update photos damage-reports" on storage.objects;
create policy "Dev update photos damage-reports"
  on storage.objects
  for update
  to anon, authenticated
  using (bucket_id = 'damage-reports')
  with check (bucket_id = 'damage-reports');

drop policy if exists "Dev delete photos damage-reports" on storage.objects;
create policy "Dev delete photos damage-reports"
  on storage.objects
  for delete
  to anon, authenticated
  using (bucket_id = 'damage-reports');
