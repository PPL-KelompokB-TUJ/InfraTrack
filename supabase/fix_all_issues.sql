-- ==============================================================================
-- SCRIPT PERBAIKAN: JALANKAN INI DI SUPABASE SQL EDITOR
-- ==============================================================================

-- 1. PASTIKAN nico@gmail.com ADALAH ADMIN DI AUTH
UPDATE auth.users 
SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb 
WHERE lower(email) = 'nico@gmail.com';

-- 2. PASTIKAN nico@gmail.com ADA DI PUBLIC.USERS (PENTING!)
-- Jika akun mendaftar dari halaman login (bukan admin), data mereka tidak masuk ke public.users.
-- Script ini akan memasukkan data mereka atau meng-update-nya menjadi admin.
INSERT INTO public.users (id, name, email, role, is_active)
SELECT id, 'Nico', email, 'admin', true
FROM auth.users
WHERE lower(email) = 'nico@gmail.com'
ON CONFLICT (email) DO UPDATE 
SET role = 'admin', is_active = true;

-- 3. MIGRASI TUGAS DARI PETUGAS DUMMY KE PETUGAS ASLI
-- Jika admin sebelumnya tidak sengaja menugaskan tugas ke petugas dummy (yang tidak punya akses login)
UPDATE public.maintenance_tasks
SET assigned_to = real_officer.id
FROM public.users dummy_officer
JOIN public.users real_officer ON lower(dummy_officer.name) = lower(real_officer.name)
WHERE public.maintenance_tasks.assigned_to = dummy_officer.id
  AND dummy_officer.role = 'field_officer'
  AND dummy_officer.id NOT IN (SELECT id FROM auth.users)
  AND real_officer.role = 'field_officer'
  AND real_officer.id IN (SELECT id FROM auth.users);

-- 4. NON-AKTIFKAN PETUGAS DUMMY AGAR TIDAK MUNCUL DI DROPDOWN
-- (Kita gunakan is_active = false alih-alih DELETE agar tidak error Foreign Key)
UPDATE public.users 
SET is_active = false 
WHERE role = 'field_officer' 
AND id NOT IN (SELECT id FROM auth.users);

-- 5. PASTIKAN TRIGGER NOTIFIKASI LAPORAN BARU AKTIF
CREATE OR REPLACE FUNCTION public.fn_on_new_damage_report()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  admin_rec record;
BEGIN
  FOR admin_rec IN 
    SELECT id FROM public.users 
    WHERE role = 'admin' AND is_active = true
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (
      admin_rec.id,
      'new_report',
      'Laporan Baru: ' || NEW.ticket_code,
      E'ID Laporan   : ' || NEW.ticket_code || E'\n' ||
      'Dibuat oleh  : ' || COALESCE(NEW.reporter_name, 'Sistem') || E'\n' ||
      'Waktu lapor  : ' || TO_CHAR(NEW.created_at, 'DD/MM/YYYY HH24:MI') || E'\n\n' ||
      'Urgensi      : ' || COALESCE(NEW.urgency_level, '-') || E'\n' ||
      'Deskripsi    : ' || COALESCE(NEW.description, '-'),
      NEW.id
    );
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_new_damage_report ON public.damage_reports;
CREATE TRIGGER trg_on_new_damage_report
AFTER INSERT ON public.damage_reports
FOR EACH ROW
EXECUTE FUNCTION public.fn_on_new_damage_report();

SELECT 'Perbaikan Database Selesai!' as status;
