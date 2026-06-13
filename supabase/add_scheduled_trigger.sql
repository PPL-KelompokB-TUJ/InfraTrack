-- Create a function to handle status determination on insert/update
CREATE OR REPLACE FUNCTION public.handle_scheduled_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only alter status if the task is currently pending, assigned, or scheduled.
  -- This prevents overriding tasks that are already in progress, completed, or cancelled.
  -- For new inserts, NEW.status is usually 'assigned' or whatever default is passed.
  IF NEW.status IN ('pending', 'assigned', 'scheduled') THEN
    IF NEW.scheduled_date::date > current_date THEN
      NEW.status := 'scheduled';
    ELSE
      -- If the task was scheduled but the date is today or in the past, set it to assigned
      IF NEW.status = 'scheduled' THEN
        NEW.status := 'assigned';
      END IF;
      -- If it's passed as 'pending', let it stay 'pending'. 
      -- If it's passed as 'assigned', let it stay 'assigned'.
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists to allow re-running this script safely
DROP TRIGGER IF EXISTS maintain_scheduled_status_trigger ON public.maintenance_tasks;

-- Create the trigger on the maintenance_tasks table
CREATE TRIGGER maintain_scheduled_status_trigger
BEFORE INSERT OR UPDATE ON public.maintenance_tasks
FOR EACH ROW
EXECUTE FUNCTION public.handle_scheduled_status();
