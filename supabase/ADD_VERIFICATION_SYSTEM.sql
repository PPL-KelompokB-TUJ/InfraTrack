-- Migration: Add damage report verification system
-- Adds columns for verification notes, priority level, and verified by admin

-- Add new columns to damage_reports table
ALTER TABLE public.damage_reports
  ADD COLUMN IF NOT EXISTS verification_notes TEXT,
  ADD COLUMN IF NOT EXISTS priority_level TEXT CHECK (priority_level IS NULL OR priority_level IN ('rendah', 'sedang', 'tinggi', 'sangat_tinggi')),
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Create index for faster queries on status and verified_by
CREATE INDEX IF NOT EXISTS idx_damage_reports_status ON public.damage_reports(status);
CREATE INDEX IF NOT EXISTS idx_damage_reports_verified_by ON public.damage_reports(verified_by);
CREATE INDEX IF NOT EXISTS idx_damage_reports_priority ON public.damage_reports(priority_level);

-- Create a table for storing verification audit logs
CREATE TABLE IF NOT EXISTS public.verification_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  damage_report_id UUID NOT NULL REFERENCES public.damage_reports(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  verified_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  verification_notes TEXT,
  priority_level TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on verification_audit_logs
ALTER TABLE public.verification_audit_logs ENABLE ROW LEVEL SECURITY;

-- Public read for the audit logs (anyone can view verification history)
CREATE POLICY "Anyone can read audit logs"
  ON public.verification_audit_logs
  FOR SELECT
  USING (true);

-- Only admins can insert audit logs
CREATE POLICY "Admins can insert audit logs"
  ON public.verification_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Display current schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'damage_reports' 
ORDER BY ordinal_position;
