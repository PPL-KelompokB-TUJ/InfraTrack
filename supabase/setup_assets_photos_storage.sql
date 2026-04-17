-- Run this script after table setup
insert into storage.buckets (id, name, public)
values ('assets-photos', 'assets-photos', true)
on conflict (id) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "Dev read photos assets-photos" on storage.objects;
drop policy if exists "Public read photos assets-photos" on storage.objects;
create policy "Public read photos assets-photos"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'assets-photos');

drop policy if exists "Dev upload photos assets-photos" on storage.objects;
drop policy if exists "Admin upload photos assets-photos" on storage.objects;
create policy "Admin upload photos assets-photos"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'assets-photos' and public.is_admin());

drop policy if exists "Dev update photos assets-photos" on storage.objects;
drop policy if exists "Admin update photos assets-photos" on storage.objects;
create policy "Admin update photos assets-photos"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'assets-photos' and public.is_admin())
  with check (bucket_id = 'assets-photos' and public.is_admin());

drop policy if exists "Dev delete photos assets-photos" on storage.objects;
drop policy if exists "Admin delete photos assets-photos" on storage.objects;
create policy "Admin delete photos assets-photos"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'assets-photos' and public.is_admin());
