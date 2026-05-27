-- =========================================================================
-- Sinkronisasi Retroaktif dan Pembuatan Tugas Pemeliharaan Dummy Otomatis
-- =========================================================================
-- Skrip ini menyelesaikan ketidaksinkronan data aduan (damage_reports) 
-- dan tugas pemeliharaan (maintenance_tasks) yang disebabkan oleh data dummy:
-- 1. Menyinkronkan status aduan yang sudah memiliki tugas.
-- 2. Membuat tugas pemeliharaan otomatis untuk aduan terverifikasi/proses/selesai 
--    yang belum memiliki tugas terkait, lalu menetapkannya ke Petugas Lapangan.
-- =========================================================================

-- Langkah 1: Sinkronisasi status aduan yang sudah memiliki tugas pemeliharaan
UPDATE public.damage_reports dr
SET status = CASE 
    WHEN mt.status = 'completed' THEN 'selesai'
    WHEN mt.status = 'in_progress' THEN 'sedang_dikerjakan'
    WHEN mt.status IN ('assigned', 'pending', 'cancelled') THEN 'terverifikasi'
    ELSE dr.status
  END,
  updated_at = now()
FROM public.maintenance_tasks mt
WHERE dr.id = mt.report_id;

-- Langkah 2: Membuat tugas pemeliharaan otomatis untuk aduan dummy yang belum punya tugas
INSERT INTO public.maintenance_tasks (
  report_id, 
  asset_id, 
  assigned_to, 
  assigned_by, 
  scheduled_date, 
  status, 
  instructions, 
  notes, 
  created_at, 
  updated_at
)
SELECT 
  dr.id as report_id,
  dr.asset_id as asset_id,
  -- Ambil ID salah satu petugas lapangan secara acak atau ambil petugas pertama (ahmad.sutrisno@example.com / ahmad)
  (SELECT id FROM public.users WHERE role = 'field_officer' AND is_active = true LIMIT 1) as assigned_to,
  -- Ambil ID salah satu admin (jika ada) untuk pengisian kolom assigned_by
  (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1) as assigned_by,
  COALESCE(dr.created_at, now()) + interval '1 day' as scheduled_date,
  CASE 
    WHEN dr.status = 'selesai' THEN 'completed'::text
    WHEN dr.status = 'sedang_dikerjakan' THEN 'in_progress'::text
    ELSE 'assigned'::text
  END as status,
  'Lakukan pemeriksaan dan perbaikan fisik pada lokasi infrastruktur yang dilaporkan.' as instructions,
  'Penugasan otomatis disinkronkan untuk menjaga konsistensi data grafik dashboard.' as notes,
  COALESCE(dr.created_at, now()) as created_at,
  now() as updated_at
FROM public.damage_reports dr
LEFT JOIN public.maintenance_tasks mt ON dr.id = mt.report_id
WHERE mt.id IS NULL 
  AND dr.status IN ('terverifikasi', 'sedang_dikerjakan', 'selesai')
  -- Pastikan asset_id tidak kosong, jika kosong ambil salah satu asset agar tugas valid
  AND dr.asset_id IS NOT NULL;

-- Langkah tambahan: Jika ada aduan dummy yang asset_id nya kosong, pasangkan ke asset default pertama
INSERT INTO public.maintenance_tasks (
  report_id, 
  asset_id, 
  assigned_to, 
  assigned_by, 
  scheduled_date, 
  status, 
  instructions, 
  notes, 
  created_at, 
  updated_at
)
SELECT 
  dr.id as report_id,
  (SELECT id FROM public.infrastructure_assets LIMIT 1) as asset_id,
  (SELECT id FROM public.users WHERE role = 'field_officer' AND is_active = true LIMIT 1) as assigned_to,
  (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1) as assigned_by,
  COALESCE(dr.created_at, now()) + interval '1 day' as scheduled_date,
  CASE 
    WHEN dr.status = 'selesai' THEN 'completed'::text
    WHEN dr.status = 'sedang_dikerjakan' THEN 'in_progress'::text
    ELSE 'assigned'::text
  END as status,
  'Lakukan pemeriksaan dan perbaikan fisik pada lokasi infrastruktur yang dilaporkan.' as instructions,
  'Penugasan otomatis disinkronkan untuk menjaga konsistensi data grafik dashboard (tanpa aset spesifik).' as notes,
  COALESCE(dr.created_at, now()) as created_at,
  now() as updated_at
FROM public.damage_reports dr
LEFT JOIN public.maintenance_tasks mt ON dr.id = mt.report_id
WHERE mt.id IS NULL 
  AND dr.status IN ('terverifikasi', 'sedang_dikerjakan', 'selesai')
  AND dr.asset_id IS NULL;

-- Konfirmasi eksekusi
SELECT 'Sinkronisasi retroaktif dan pengisian tugas dummy selesai!' as status;
