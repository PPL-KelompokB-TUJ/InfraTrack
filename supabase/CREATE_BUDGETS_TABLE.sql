-- Create the budgets table with reference to maintenance_tasks
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.maintenance_tasks(id) ON DELETE CASCADE,
  estimated_cost DECIMAL(12, 2) NOT NULL DEFAULT 0,
  actual_cost DECIMAL(12, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_task_id UNIQUE (task_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.budgets TO authenticated;

-- Create RLS Policies for authenticated users
CREATE POLICY "Authenticated can select budgets"
  ON public.budgets
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert budgets"
  ON public.budgets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update budgets"
  ON public.budgets
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete budgets"
  ON public.budgets
  FOR DELETE
  TO authenticated
  USING (true);
