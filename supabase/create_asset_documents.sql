-- Asset Documents Table
-- Run this in Supabase SQL Editor

create table if not exists public.asset_documents (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.infrastructure_assets(id) on delete cascade,
  uploaded_by uuid not null references public.users(id) on delete set null,
  name text not null,
  file_path text not null,
  file_url text not null,
  file_size bigint not null default 0,
  file_type text not null,
  doc_type text not null check (doc_type in ('gambar_teknis', 'spesifikasi', 'kontrak', 'lainnya')),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at trigger
create or replace function public.set_asset_documents_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_asset_documents_updated_at on public.asset_documents;
create trigger trg_asset_documents_updated_at
  before update on public.asset_documents
  for each row execute function public.set_asset_documents_updated_at();

-- Indexes
create index if not exists asset_documents_asset_id_idx on public.asset_documents(asset_id);
create index if not exists asset_documents_created_at_idx on public.asset_documents(created_at);
create index if not exists asset_documents_doc_type_idx on public.asset_documents(doc_type);

-- RLS
alter table public.asset_documents enable row level security;

drop policy if exists "Admin can manage asset documents" on public.asset_documents;
drop policy if exists "Authenticated can view asset documents" on public.asset_documents;

create policy "Admin can manage asset documents"
  on public.asset_documents
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Authenticated can view asset documents"
  on public.asset_documents
  for select
  to authenticated
  using (true);

grant select, insert, update, delete on public.asset_documents to authenticated;

-- Storage bucket for asset documents
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'asset-documents',
  'asset-documents',
  false,
  52428800,  -- 50 MB
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do nothing;

-- Storage RLS: admin can upload/delete, authenticated can read
drop policy if exists "Admin can upload asset documents" on storage.objects;
drop policy if exists "Admin can delete asset documents" on storage.objects;
drop policy if exists "Authenticated can read asset documents" on storage.objects;

create policy "Admin can upload asset documents"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'asset-documents' and public.is_admin());

create policy "Admin can delete asset documents"
  on storage.objects for delete to authenticated
  using (bucket_id = 'asset-documents' and public.is_admin());

create policy "Authenticated can read asset documents"
  on storage.objects for select to authenticated
  using (bucket_id = 'asset-documents');
