-- Run this script in Supabase SQL Editor
-- This adds the 'scheduled' status to the maintenance_tasks table
-- and creates an auto-update function that can be scheduled via pg_cron.

-- 1. Update the check constraint to include 'scheduled'
ALTER TABLE public.maintenance_tasks DROP CONSTRAINT IF EXISTS maintenance_tasks_status_check;
ALTER TABLE public.maintenance_tasks ADD CONSTRAINT maintenance_tasks_status_check 
  CHECK (status in ('pending', 'assigned', 'in_progress', 'completed', 'cancelled', 'scheduled'));

-- 2. Create the function to automatically update 'scheduled' to 'assigned' when the scheduled date arrives
CREATE OR REPLACE FUNCTION public.auto_update_scheduled_tasks()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.maintenance_tasks
  SET status = 'assigned',
      updated_at = now()
  WHERE status = 'scheduled'
    AND scheduled_date::date <= current_date;
END;
$$;

GRANT EXECUTE ON FUNCTION public.auto_update_scheduled_tasks() TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_update_scheduled_tasks() TO service_role;

-- 3. (Optional) Schedule the function to run daily at 00:01 using pg_cron
-- Note: Ensure the pg_cron extension is enabled in your Supabase project (Database -> Extensions).
-- If you uncomment the block below, it will run the function automatically every day.

/*
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'update-scheduled-maintenance-tasks',
  '1 0 * * *', -- Runs every day at 00:01 UTC
  $$SELECT public.auto_update_scheduled_tasks()$$
);
*/
