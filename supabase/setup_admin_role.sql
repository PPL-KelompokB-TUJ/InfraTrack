-- Run this script after creating at least one auth user.
-- Replace the email below with the user that should become admin.

do $$
declare
  v_admin_email text := 'admin@infratrack.id';
  v_user_id uuid;
begin
  select id
  into v_user_id
  from auth.users
  where lower(email) = lower(v_admin_email)
  limit 1;

  if v_user_id is null then
    raise exception 'User dengan email % belum ada di auth.users', v_admin_email;
  end if;

  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin')
  where id = v_user_id;
end
$$;

-- JWT role baru akan terbaca setelah user login ulang.
