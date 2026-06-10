-- Fungsi baru untuk menangani notifikasi petugas secara cerdas (Insert & Update)
CREATE OR REPLACE FUNCTION public.fn_on_task_changes()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.assigned_to IS NOT NULL THEN
      IF NEW.scheduled_date::date <= current_date THEN
        INSERT INTO public.notifications (user_id, type, title, message, related_id)
        VALUES (
          NEW.assigned_to, 'task_assigned', 'Penugasan Pemeliharaan Baru (Mulai Hari Ini)',
          E'ID Penugasan : ' || NEW.id || E'\n' ||
          'Jadwal       : ' || TO_CHAR(NEW.scheduled_date, 'DD/MM/YYYY') || E'\n' ||
          'Estimasi     : Rp' || COALESCE(NEW.estimated_cost::text, '0') || E'\n\n' ||
          'Instruksi    : ' || COALESCE(NEW.instructions, '-'),
          NEW.id
        );
      ELSE
        INSERT INTO public.notifications (user_id, type, title, message, related_id)
        VALUES (
          NEW.assigned_to, 'task_scheduled', 'Penugasan Pemeliharaan Baru (Dijadwalkan)',
          E'Anda memiliki tugas mendatang.\n' ||
          'ID Penugasan : ' || NEW.id || E'\n' ||
          'Jadwal       : ' || TO_CHAR(NEW.scheduled_date, 'DD/MM/YYYY') || E'\n' ||
          'Estimasi     : Rp' || COALESCE(NEW.estimated_cost::text, '0') || E'\n\n' ||
          'Instruksi    : ' || COALESCE(NEW.instructions, '-'),
          NEW.id
        );
      END IF;
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Skenario 1: Petugas diganti (Assigned_to changed)
    IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
      
      -- Beri tahu Petugas Lama bahwa tugasnya dibatalkan/dialihkan
      IF OLD.assigned_to IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, type, title, message, related_id)
        VALUES (
          OLD.assigned_to, 'task_cancelled', 'Penugasan Dibatalkan (Dialihkan)',
          E'Penugasan ini telah dialihkan ke petugas lain dan tidak lagi menjadi tanggung jawab Anda.\n' ||
          'ID Penugasan : ' || OLD.id || E'\n' ||
          'Jadwal       : ' || TO_CHAR(OLD.scheduled_date, 'DD/MM/YYYY'),
          OLD.id
        );
      END IF;

      -- Beri tahu Petugas Baru bahwa dia mendapat tugas (dengan pengecekan tanggal)
      IF NEW.assigned_to IS NOT NULL THEN
        IF NEW.scheduled_date::date <= current_date THEN
          INSERT INTO public.notifications (user_id, type, title, message, related_id)
          VALUES (
            NEW.assigned_to, 'task_assigned', 'Penugasan Pemeliharaan Baru (Mulai Hari Ini)',
            E'ID Penugasan : ' || NEW.id || E'\n' ||
            'Jadwal       : ' || TO_CHAR(NEW.scheduled_date, 'DD/MM/YYYY') || E'\n' ||
            'Estimasi     : Rp' || COALESCE(NEW.estimated_cost::text, '0') || E'\n\n' ||
            'Instruksi    : ' || COALESCE(NEW.instructions, '-'),
            NEW.id
          );
        ELSE
          INSERT INTO public.notifications (user_id, type, title, message, related_id)
          VALUES (
            NEW.assigned_to, 'task_scheduled', 'Penugasan Pemeliharaan Baru (Dijadwalkan)',
            E'Anda memiliki tugas mendatang (telah dialihkan ke Anda).\n' ||
            'ID Penugasan : ' || NEW.id || E'\n' ||
            'Jadwal       : ' || TO_CHAR(NEW.scheduled_date, 'DD/MM/YYYY') || E'\n' ||
            'Estimasi     : Rp' || COALESCE(NEW.estimated_cost::text, '0') || E'\n\n' ||
            'Instruksi    : ' || COALESCE(NEW.instructions, '-'),
            NEW.id
          );
        END IF;
      END IF;

    -- Skenario 2: Petugas TETAP SAMA, tapi TANGGAL TERJADWAL berubah
    ELSIF OLD.scheduled_date IS DISTINCT FROM NEW.scheduled_date THEN
      IF NEW.assigned_to IS NOT NULL THEN
        
        -- Dulu masa depan, sekarang ditarik jadi Hari Ini (Dipercepat)
        IF OLD.scheduled_date::date > current_date AND NEW.scheduled_date::date <= current_date THEN
          INSERT INTO public.notifications (user_id, type, title, message, related_id)
          VALUES (
            NEW.assigned_to, 'task_rescheduled', 'Perubahan Jadwal: Penugasan Dipercepat',
            E'Jadwal penugasan Anda telah dimajukan menjadi HARI INI dan statusnya menjadi Ditugaskan.\n' ||
            'ID Penugasan : ' || NEW.id || E'\n' ||
            'Jadwal Baru  : ' || TO_CHAR(NEW.scheduled_date, 'DD/MM/YYYY') || E'\n' ||
            'Estimasi     : Rp' || COALESCE(NEW.estimated_cost::text, '0') || E'\n\n' ||
            'Instruksi    : ' || COALESCE(NEW.instructions, '-'),
            NEW.id
          );
          
        -- Dulu Hari Ini (atau masa lalu), sekarang didorong ke Masa Depan (Diundur)
        ELSIF OLD.scheduled_date::date <= current_date AND NEW.scheduled_date::date > current_date THEN
          INSERT INTO public.notifications (user_id, type, title, message, related_id)
          VALUES (
            NEW.assigned_to, 'task_rescheduled', 'Perubahan Jadwal: Penugasan Diundur',
            E'Jadwal penugasan Anda telah diundur dan statusnya kembali menjadi Dijadwalkan.\n' ||
            'ID Penugasan : ' || NEW.id || E'\n' ||
            'Jadwal Baru  : ' || TO_CHAR(NEW.scheduled_date, 'DD/MM/YYYY') || E'\n' ||
            'Estimasi     : Rp' || COALESCE(NEW.estimated_cost::text, '0') || E'\n\n' ||
            'Instruksi    : ' || COALESCE(NEW.instructions, '-'),
            NEW.id
          );
          
        -- Dulu Masa Depan, sekarang Masa Depan juga (Hanya ganti hari/tanggal)
        ELSE
          INSERT INTO public.notifications (user_id, type, title, message, related_id)
          VALUES (
            NEW.assigned_to, 'task_rescheduled', 'Perubahan Jadwal: Tanggal Diperbarui',
            E'Terdapat penyesuaian pada tanggal penugasan terjadwal Anda.\n' ||
            'ID Penugasan : ' || NEW.id || E'\n' ||
            'Jadwal Baru  : ' || TO_CHAR(NEW.scheduled_date, 'DD/MM/YYYY') || E'\n' ||
            'Estimasi     : Rp' || COALESCE(NEW.estimated_cost::text, '0') || E'\n\n' ||
            'Instruksi    : ' || COALESCE(NEW.instructions, '-'),
            NEW.id
          );
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- MATIKAN / HAPUS TRIGGER LAMA AGAR TIDAK MENGIRIM NOTIFIKASI GANDA
DROP TRIGGER IF EXISTS trg_on_task_assigned ON public.maintenance_tasks;
DROP FUNCTION IF EXISTS public.fn_on_task_assigned();

-- Hapus trigger baru ini jika ada, agar script ini aman di-run berkali-kali
DROP TRIGGER IF EXISTS trg_on_task_changes ON public.maintenance_tasks;

-- PASANG TRIGGER BARU
CREATE TRIGGER trg_on_task_changes
AFTER INSERT OR UPDATE ON public.maintenance_tasks
FOR EACH ROW
EXECUTE FUNCTION public.fn_on_task_changes();
