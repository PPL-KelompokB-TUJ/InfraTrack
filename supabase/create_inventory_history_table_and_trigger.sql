-- ==========================================
-- PBI-18 Enhancement: Inventory History
-- ==========================================

-- 1. Create inventory_history table
CREATE TABLE IF NOT EXISTS public.inventory_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
    action_type varchar(50) NOT NULL CHECK (action_type IN ('Pemakaian', 'Restok', 'Edit Data', 'Material Baru', 'Penyesuaian')),
    quantity_change numeric NOT NULL,
    stock_before numeric NOT NULL,
    stock_after numeric NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    actor_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    reference_note text,
    created_at timestamp with time zone DEFAULT now()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_inventory_history_material_id ON public.inventory_history(material_id);
CREATE INDEX IF NOT EXISTS idx_inventory_history_action_type ON public.inventory_history(action_type);
CREATE INDEX IF NOT EXISTS idx_inventory_history_created_at ON public.inventory_history(created_at);

-- Enable RLS
ALTER TABLE public.inventory_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admin can view all history
DROP POLICY IF EXISTS "Admin view all inventory history" ON public.inventory_history;
CREATE POLICY "Admin view all inventory history" ON public.inventory_history
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Field officers can insert history (via triggers/api) and view history
DROP POLICY IF EXISTS "Officers view and insert history" ON public.inventory_history;
CREATE POLICY "Officers view and insert history" ON public.inventory_history
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true); -- Allow inserts from the application for all authenticated users

-- 2. Update existing handle_material_usage() trigger to automatically log 'Pemakaian'
CREATE OR REPLACE FUNCTION handle_material_usage()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
DECLARE
    v_stock_before numeric;
    v_unit_price numeric(12,2);
BEGIN
    -- Get current stock before update
    SELECT stock, unit_price INTO v_stock_before, v_unit_price 
    FROM public.materials 
    WHERE id = NEW.material_id;

    -- Decrease stock in materials
    UPDATE public.materials
    SET stock = stock - NEW.quantity_used,
        updated_at = now()
    WHERE id = NEW.material_id;

    -- Insert into inventory_history
    INSERT INTO public.inventory_history (
        material_id, 
        action_type, 
        quantity_change, 
        stock_before, 
        stock_after, 
        unit_price, 
        actor_id, 
        reference_note
    ) VALUES (
        NEW.material_id,
        'Pemakaian',
        -NEW.quantity_used,
        v_stock_before,
        v_stock_before - NEW.quantity_used,
        v_unit_price,
        NEW.reported_by, -- the user who reported the usage
        'Pemakaian material untuk Task ID: ' || NEW.task_id
    );

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

-- Make sure the trigger is attached (it should already be from CREATE_MATERIALS_AND_USAGES.sql)
DROP TRIGGER IF EXISTS on_material_usage_insert ON public.material_usages;
CREATE TRIGGER on_material_usage_insert
AFTER INSERT ON public.material_usages
FOR EACH ROW
EXECUTE FUNCTION handle_material_usage();
