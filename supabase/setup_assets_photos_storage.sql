-- Run this script after table setup
insert into storage.buckets (id, name, public)
values ('assets-photos', 'assets-photos', true)
on conflict (id) do nothing;

-- Development-only policies for quick MVP iteration.
-- Replace with stricter policies in production.
drop policy if exists "Dev read photos assets-photos" on storage.objects;
create policy "Dev read photos assets-photos"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'assets-photos');

drop policy if exists "Dev upload photos assets-photos" on storage.objects;
create policy "Dev upload photos assets-photos"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'assets-photos');

drop policy if exists "Dev update photos assets-photos" on storage.objects;
create policy "Dev update photos assets-photos"
  on storage.objects
  for update
  to anon, authenticated
  using (bucket_id = 'assets-photos')
  with check (bucket_id = 'assets-photos');

drop policy if exists "Dev delete photos assets-photos" on storage.objects;
create policy "Dev delete photos assets-photos"
  on storage.objects
  for delete
  to anon, authenticated
  using (bucket_id = 'assets-photos');
