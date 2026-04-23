import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function addVerificationColumns() {
  try {
    console.log('🔄 Adding verification columns to damage_reports...\n');

    // Check if columns already exist by trying to select them
    const { error: checkError } = await supabase
      .from('damage_reports')
      .select('verification_notes')
      .limit(1);

    if (!checkError) {
      console.log('✅ Columns already exist');
      return;
    }

    // Columns don't exist, use Supabase function if available or notify user
    console.log('⚠️  Columns need to be added. Please execute this SQL in Supabase SQL Editor:\n');
    
    const sqlStatements = [
      `ALTER TABLE public.damage_reports
  ADD COLUMN IF NOT EXISTS verification_notes TEXT,
  ADD COLUMN IF NOT EXISTS priority_level TEXT,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;`,
      
      `ALTER TABLE public.damage_reports
  ADD CONSTRAINT check_priority_level CHECK (priority_level IS NULL OR priority_level IN ('rendah', 'sedang', 'tinggi', 'sangat_tinggi'));`,
      
      `CREATE INDEX IF NOT EXISTS idx_damage_reports_status ON public.damage_reports(status);`,
      `CREATE INDEX IF NOT EXISTS idx_damage_reports_priority ON public.damage_reports(priority_level);`,
      
      `CREATE TABLE IF NOT EXISTS public.verification_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  damage_report_id UUID NOT NULL REFERENCES public.damage_reports(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  verified_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  verification_notes TEXT,
  priority_level TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`,

      `ALTER TABLE public.verification_audit_logs ENABLE ROW LEVEL SECURITY;`,

      `CREATE POLICY IF NOT EXISTS "Anyone can read audit logs"
  ON public.verification_audit_logs
  FOR SELECT
  USING (true);`,

      `CREATE POLICY IF NOT EXISTS "Admins can insert audit logs"
  ON public.verification_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());`
    ];

    sqlStatements.forEach((sql, i) => {
      console.log(`${i + 1}. ${sql.substring(0, 60)}...\n`);
    });

    console.log('\n📂 Or use this file: supabase/ADD_VERIFICATION_SYSTEM.sql');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

addVerificationColumns();
