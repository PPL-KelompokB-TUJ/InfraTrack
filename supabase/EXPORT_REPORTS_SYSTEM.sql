-- Migration: Setup Export Reports System (PBI-14)
-- Run this script in the Supabase SQL Editor manually to prepare the database schema.

-- 1. Add actual_cost to maintenance_tasks if it doesn't exist
ALTER TABLE public.maintenance_tasks ADD COLUMN IF NOT EXISTS actual_cost decimal(12, 2);

-- 2. Create export_history table to track export jobs
CREATE TABLE IF NOT EXISTS public.export_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    report_type text NOT NULL, -- 'asset-condition', 'maintenance-recap', 'officer-performance'
    format text NOT NULL, -- 'pdf', 'xlsx'
    status text NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    file_url text,
    error_message text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Enable RLS on export_history
ALTER TABLE public.export_history ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies (Only Admins can read and write export history)
-- Using public.is_admin() which is the standard admin check function in the database.
DROP POLICY IF EXISTS "Admins can manage export history" ON public.export_history;
CREATE POLICY "Admins can manage export history"
    ON public.export_history
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Also allow reads for admin testing
DROP POLICY IF EXISTS "Anyone authenticated can read export history" ON public.export_history;
CREATE POLICY "Anyone authenticated can read export history"
    ON public.export_history
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- 5. Add indices for faster search
CREATE INDEX IF NOT EXISTS idx_export_history_status ON public.export_history(status);
CREATE INDEX IF NOT EXISTS idx_export_history_created_at ON public.export_history(created_at);
