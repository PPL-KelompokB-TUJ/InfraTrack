import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fgcunyebdabjvzgiaidc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('🔑 Logging in as Admin...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@infratrack.id',
    password: 'Admin@1234'
  });

  if (authError) {
    console.error('❌ Authentication failed:', authError.message);
    process.exit(1);
  }

  console.log('✅ Admin login successful.');

  const sqlPath = path.join(__dirname, '..', 'supabase', 'add_admin_notification_triggers.sql');
  console.log('📖 Reading SQL file from:', sqlPath);
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('⚡ Executing SQL migration...');
  const { data, error } = await supabase.rpc('exec', { command: sql });

  if (error) {
    console.error('❌ RPC "exec" failed:', error.message);
  } else {
    console.log('✅ SQL migration executed successfully!', data);
  }
}

run();
