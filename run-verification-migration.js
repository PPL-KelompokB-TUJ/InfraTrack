import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

// Use admin client for schema operations
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  db: { schema: 'public' }
});

async function verifyColumns() {
  try {
    console.log('📋 Checking verification system columns...\n');

    // Try to query with new columns to verify they exist
    const { data, error } = await supabase
      .from('damage_reports')
      .select('verification_notes, priority_level, verified_by, verified_at')
      .limit(1);

    if (!error) {
      console.log('✅ All verification columns exist in damage_reports table');
      return true;
    } else if (error.message?.includes('column') || error.message?.includes('does not exist')) {
      console.log('⚠️  Some columns are missing. Please run migration manually in Supabase SQL Editor');
      console.log(`Error: ${error.message}`);
      return false;
    }
  } catch (err) {
    console.error('Error checking columns:', err.message);
    return false;
  }
}

async function setup() {
  console.log('🔄 Setting up verification system...\n');
  
  const hasColumns = await verifyColumns();
  
  if (hasColumns) {
    console.log('\n✨ Verification system is ready!');
    console.log('\nNext steps:');
    console.log('1. Check AdminDashboardPage for verification panel');
    console.log('2. Administrators can now verify damage reports');
    console.log('3. Notifications will be sent when status changes\n');
  } else {
    console.log('\n⚠️  Please run this SQL in Supabase SQL Editor:\n');
    console.log('📂 File: supabase/ADD_VERIFICATION_SYSTEM.sql');
  }
}

setup();
