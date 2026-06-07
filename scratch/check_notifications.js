import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .limit(5);

  if (error) {
    console.error('Error fetching notifications:', error.message);
  } else {
    console.log('Notifications (sample):', JSON.stringify(data, null, 2));
  }
}

run();
