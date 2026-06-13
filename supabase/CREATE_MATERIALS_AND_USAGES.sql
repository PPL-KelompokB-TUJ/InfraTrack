-- ==========================================
-- PBI-18: Materials & Material Usages Schema
-- ==========================================

-- 1. Create materials table
CREATE TABLE IF NOT EXISTS public.materials (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name varchar(255) NOT NULL,
    unit varchar(50) NOT NULL,
    stock numeric NOT NULL DEFAULT 0 CHECK (stock >= 0),
    unit_price numeric(12,2) NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Indices for materials
CREATE INDEX IF NOT EXISTS idx_materials_name ON public.materials(name);
CREATE INDEX IF NOT EXISTS idx_materials_is_active ON public.materials(is_active);

-- Enable RLS for materials
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for materials
-- Admin can manage all
DROP POLICY IF EXISTS "Admin full access to materials" ON public.materials;
CREATE POLICY "Admin full access to materials" ON public.materials
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Everyone authenticated can read active materials
DROP POLICY IF EXISTS "Authenticated users can read active materials" ON public.materials;
CREATE POLICY "Authenticated users can read active materials" ON public.materials
    FOR SELECT
    TO authenticated
    USING (is_active = true);


-- 2. Create material_usages table
CREATE TABLE IF NOT EXISTS public.material_usages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id uuid NOT NULL REFERENCES public.maintenance_tasks(id) ON DELETE CASCADE,
    material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
    quantity_used numeric NOT NULL CHECK (quantity_used > 0),
    unit_price_at_usage numeric(12,2) NOT NULL,
    additional_cost numeric(12,2) DEFAULT 0,
    total_cost numeric(12,2) NOT NULL,
    notes text,
    reported_by uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    created_at timestamp with time zone DEFAULT now()
);

-- Indices for material_usages
CREATE INDEX IF NOT EXISTS idx_material_usages_task_id ON public.material_usages(task_id);

-- Enable RLS for material_usages
ALTER TABLE public.material_usages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for material_usages
-- Admin can view all
DROP POLICY IF EXISTS "Admin view all material usages" ON public.material_usages;
CREATE POLICY "Admin view all material usages" ON public.material_usages
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Field officers can insert and view usages for their assigned tasks
DROP POLICY IF EXISTS "Field officers can view and insert their task usages" ON public.material_usages;
CREATE POLICY "Field officers can view and insert their task usages" ON public.material_usages
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.maintenance_tasks 
            WHERE maintenance_tasks.id = material_usages.task_id 
            AND maintenance_tasks.assigned_to = auth.uid()
        )
    );

-- 3. Create Trigger to update actual_cost in budgets/maintenance_tasks and decrease stock
CREATE OR REPLACE FUNCTION handle_material_usage()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
    -- Decrease stock in materials
    UPDATE public.materials
    SET stock = stock - NEW.quantity_used,
        updated_at = now()
    WHERE id = NEW.material_id;

    -- Update actual_cost in maintenance_tasks
    UPDATE public.maintenance_tasks
    SET actual_cost = COALESCE(actual_cost, 0) + NEW.total_cost,
        updated_at = now()
    WHERE id = NEW.task_id;

    -- Also update actual_cost in budgets if it exists for this task
    UPDATE public.budgets
    SET actual_cost = COALESCE(actual_cost, 0) + NEW.total_cost,
        updated_at = now()
    WHERE task_id = NEW.task_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_material_usage_insert ON public.material_usages;
CREATE TRIGGER on_material_usage_insert
AFTER INSERT ON public.material_usages
FOR EACH ROW
EXECUTE FUNCTION handle_material_usage();
