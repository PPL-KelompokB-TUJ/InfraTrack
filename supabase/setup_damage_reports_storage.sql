-- Run this in Supabase SQL Editor to setup storage policies for damage-reports

-- Create the damage-reports bucket if not exists
-- This should be done via Supabase Dashboard > Storage > Create New Bucket
-- Name: damage-reports
-- Public: true
-- File size limit: 5240880 bytes (5MB)
-- Allowed MIME types: image/jpeg, image/png, image/gif, image/webp

-- Enable RLS on storage
alter table if exists storage.objects enable row level security;

-- Policy to allow anyone to upload damage report photos
drop policy if exists "Enable damage report photo uploads" on storage.objects;
create policy "Enable damage report photo uploads"
  on storage.objects
  for insert
  to anon, authenticated
  with check (
    bucket_id = 'damage-reports'
    and (storage.filename(name))::text ~ '\.jpg$|\.jpeg$|\.png$|\.gif$|\.webp$'::text
  );

-- Policy to allow anyone to read damage report photos
drop policy if exists "Enable damage report photo reads" on storage.objects;
create policy "Enable damage report photo reads"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'damage-reports');
