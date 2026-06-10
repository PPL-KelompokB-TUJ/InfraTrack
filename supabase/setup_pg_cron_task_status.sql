-- ==========================================
-- CRON JOB: Update Status Tugas Otomatis
-- ==========================================

-- 1. Mengaktifkan ekstensi pg_cron (wajib untuk Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Menghapus jadwal sebelumnya jika ada (agar tidak bentrok/dobel)
-- Jika error "job not found", bisa diabaikan.
DO $$
BEGIN
  PERFORM cron.unschedule('update-scheduled-tasks');
EXCEPTION WHEN others THEN
  -- Abaikan jika jadwal belum pernah dibuat
END $$;

-- 3. Membuat jadwal baru
-- Format cron: '1 0 * * *' artinya menit ke-1, jam 00 (tengah malam), setiap hari
SELECT cron.schedule(
  'update-scheduled-tasks',
  '1 0 * * *',
  $$
    -- Perintah SQL yang akan dieksekusi secara otomatis
    UPDATE public.maintenance_tasks
    SET 
      status = 'assigned',
      updated_at = NOW()
    WHERE status = 'scheduled' AND scheduled_date::date <= CURRENT_DATE;
  $$
);

-- Catatan:
-- Karena cron berjalan di UTC secara default di Supabase, '1 0 * * *' (00:01 UTC)
-- itu setara dengan jam 07:01 WIB pagi.
-- Jika Anda ingin cron ini berjalan jam 00:01 WIB malam (WIB = UTC+7),
-- maka Anda harus mengaturnya ke jam 17:01 UTC hari sebelumnya ('1 17 * * *').
-- Namun, untuk kemudahan dan kejelasan, script ini mengeksekusinya berdasarkan
-- jam server database (biasanya disetel sesuai kebutuhan project).
