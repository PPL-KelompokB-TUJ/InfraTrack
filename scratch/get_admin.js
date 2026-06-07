import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fgcunyebdabjvzgiaidc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role, is_active')
    .eq('role', 'admin');
  
  if (error) {
    console.error('Error fetching users:', error.message);
  } else {
    console.log('Admin users list:', JSON.stringify(data, null, 2));
  }
}

run();
