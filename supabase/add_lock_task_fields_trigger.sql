-- Create a function to prevent editing critical fields if task is running or done
CREATE OR REPLACE FUNCTION public.prevent_editing_active_tasks()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the old status was 'in_progress' or 'completed'
  IF OLD.status IN ('in_progress', 'completed') THEN
    -- If they try to change the assigned_to officer
    IF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to THEN
      RAISE EXCEPTION 'Tidak dapat mengubah petugas lapangan karena tugas sudah sedang dikerjakan atau selesai.';
    END IF;
    
    -- If they try to change the scheduled_date
    IF NEW.scheduled_date IS DISTINCT FROM OLD.scheduled_date THEN
      RAISE EXCEPTION 'Tidak dapat mengubah tanggal terjadwal karena tugas sudah sedang dikerjakan atau selesai.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS prevent_editing_active_tasks_trigger ON public.maintenance_tasks;

-- Create the trigger on BEFORE UPDATE
CREATE TRIGGER prevent_editing_active_tasks_trigger
BEFORE UPDATE ON public.maintenance_tasks
FOR EACH ROW
EXECUTE FUNCTION public.prevent_editing_active_tasks();
