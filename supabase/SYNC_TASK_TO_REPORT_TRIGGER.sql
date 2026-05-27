-- =========================================================================
-- Sinkronisasi Status: maintenance_tasks -> damage_reports
-- =========================================================================
-- Trigger ini memastikan bahwa ketika status tugas pemeliharaan diperbarui
-- oleh petugas lapangan, status aduan/laporan kerusakan terkait di tabel
-- damage_reports akan disinkronkan secara otomatis.
-- =========================================================================

-- 1. Membuat fungsi trigger sinkronisasi
CREATE OR REPLACE FUNCTION public.sync_task_status_to_report()
RETURNS TRIGGER AS $$
BEGIN
  -- Jalankan sinkronisasi jika data baru ditambahkan (INSERT) ATAU status berubah (UPDATE)
  IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    
    -- Status: Sedang Dikerjakan (in_progress)
    IF NEW.status = 'in_progress' THEN
      UPDATE public.damage_reports
      SET status = 'sedang_dikerjakan', updated_at = now()
      WHERE id = NEW.report_id;
      
    -- Status: Selesai (completed)
    ELSIF NEW.status = 'completed' THEN
      UPDATE public.damage_reports
      SET status = 'selesai', updated_at = now()
      WHERE id = NEW.report_id;
      
    -- Status: Ditugaskan / Pending / Dibatalkan (assigned / pending / cancelled)
    -- Laporan dikembalikan ke status 'terverifikasi' agar tetap terdata sebagai siap ditindaklanjuti
    ELSIF NEW.status IN ('assigned', 'pending', 'cancelled') THEN
      UPDATE public.damage_reports
      SET status = 'terverifikasi', updated_at = now()
      WHERE id = NEW.report_id;
    END IF;

  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Menghapus trigger lama jika sudah ada
DROP TRIGGER IF EXISTS trg_sync_task_status_to_report ON public.maintenance_tasks;

-- 3. Membuat trigger baru pada tabel maintenance_tasks
CREATE TRIGGER trg_sync_task_status_to_report
AFTER INSERT OR UPDATE OF status ON public.maintenance_tasks
FOR EACH ROW
EXECUTE FUNCTION public.sync_task_status_to_report();

-- Output status penyelesaian script
SELECT 'Trigger sinkronisasi status berhasil dipasang!' as status;
