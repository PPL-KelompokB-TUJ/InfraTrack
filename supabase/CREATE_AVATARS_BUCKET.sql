-- ============================================================
-- Create "avatars" storage bucket for user profile photos
-- Run this in Supabase SQL Editor (Storage section must be enabled)
-- ============================================================

-- Insert the bucket (idempotent)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,          -- public bucket so URLs are accessible without auth
  2097152,       -- 2 MB limit
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public            = excluded.public,
      file_size_limit   = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ── RLS policies ──────────────────────────────────────────────────────

-- Allow any authenticated user to upload their own avatar
-- (path must start with their own user id)
create policy "Authenticated users can upload own avatar"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow any authenticated user to update their own avatar
create policy "Authenticated users can update own avatar"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow anyone to read avatars (public bucket)
create policy "Anyone can read avatars"
on storage.objects
for select
to public
using (bucket_id = 'avatars');
