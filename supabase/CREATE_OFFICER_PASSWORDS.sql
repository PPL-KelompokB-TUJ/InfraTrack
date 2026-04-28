-- Create table to store password hashes for field officers
-- Run this in Supabase SQL Editor

create table if not exists public.officer_passwords (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  password_hash text not null,
  temp_password_hash text,
  must_change_password boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create index on user_id for faster lookups
create index if not exists officer_passwords_user_id_idx on public.officer_passwords(user_id);

-- Enable RLS
alter table public.officer_passwords enable row level security;

-- RLS Policies
drop policy if exists "Authenticated can view own password" on public.officer_passwords;
create policy "Authenticated can view own password"
  on public.officer_passwords
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Authenticated can update own password" on public.officer_passwords;
create policy "Authenticated can update own password"
  on public.officer_passwords
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Admins can insert passwords" on public.officer_passwords;
create policy "Admins can insert passwords"
  on public.officer_passwords
  for insert
  to authenticated
  with check (true);

grant select, insert, update on public.officer_passwords to authenticated;

-- Create trigger for updated_at
create or replace function public.set_officer_passwords_updated_at_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_officer_passwords_updated_at on public.officer_passwords;
create trigger trg_officer_passwords_updated_at before update on public.officer_passwords for each row
execute function public.set_officer_passwords_updated_at_timestamp();

select 'Officer passwords table created successfully!' as status;
