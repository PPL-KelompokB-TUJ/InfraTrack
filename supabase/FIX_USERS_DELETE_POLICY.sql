-- Fix RLS policy for DELETE on users table
-- Allow admins (authenticated users) to delete officers

drop policy if exists "Admins can delete users" on public.users;
create policy "Admins can delete users"
  on public.users
  for delete
  to authenticated
  using (auth.uid() is not null);  -- Any authenticated user (admin) can delete

select 'Delete policy added to users table' as status;
