-- =========================================================================
-- Penyelarasan Jumlah Data: Laporan Terverifikasi & Tugas Ditugaskan
-- =========================================================================
-- Skrip ini merapikan data dummy agar:
-- 1. Mengurangi jumlah laporan 'terverifikasi' sebanyak 6 data (menjadi 26).
-- 2. Menghapus tugas pemeliharaan terkait untuk 6 laporan tersebut.
-- 3. Menghapus tugas yatim piatu (orphan tasks) yang tidak memiliki aduan.
-- =========================================================================

-- 1. Hapus tugas pemeliharaan dari 6 laporan terverifikasi pertama
WITH extra_reports AS (
  SELECT id FROM public.damage_reports 
  WHERE status = 'terverifikasi' 
  LIMIT 6
)
DELETE FROM public.maintenance_tasks 
WHERE report_id IN (SELECT id FROM extra_reports);

-- 2. Hapus 6 laporan terverifikasi tersebut
WITH extra_reports AS (
  SELECT id FROM public.damage_reports 
  WHERE status = 'terverifikasi' 
  LIMIT 6
)
DELETE FROM public.damage_reports 
WHERE id IN (SELECT id FROM extra_reports);

-- 3. Hapus semua tugas yang tidak memiliki relasi laporan aduan yang valid (orphan tasks)
DELETE FROM public.maintenance_tasks 
WHERE report_id IS NULL;

-- Output status penyelesaian
SELECT 'Penyelarasan jumlah data selesai! Jumlah Terverifikasi sekarang adalah 26 aduan.' as status;
