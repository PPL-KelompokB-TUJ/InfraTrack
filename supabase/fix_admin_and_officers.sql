-- 1. Perbaiki Role Admin untuk nico@gmail.com
UPDATE auth.users 
SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb 
WHERE email = 'nico@gmail.com';

UPDATE public.users 
SET role = 'admin', is_active = true 
WHERE email = 'nico@gmail.com';

-- 2. Hapus Petugas Dummy / Mock (yang tidak punya akun login asli)
-- Ini mencegah admin kebingungan saat memilih petugas di dropdown (karena namanya sama)
DELETE FROM public.users 
WHERE role = 'field_officer' 
AND id NOT IN (SELECT id FROM auth.users);

SELECT 'Sinkronisasi role Admin dan perbaikan akun Petugas berhasil!' as status;
