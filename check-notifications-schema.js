import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('notifications').select('*').limit(1);
  if (error) {
    console.error('Error fetching:', error);
  } else {
    // try to insert a dummy to see if fields exist, then rollback or just log
    console.log('Fetching columns...');
    const { data: cols, error: colError } = await supabase.rpc('get_table_columns', { table_name: 'notifications' });
    if(colError) console.log(colError);
    console.log(cols);
  }
}

check();
