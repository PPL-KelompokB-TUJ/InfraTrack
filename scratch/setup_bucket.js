import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

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

  console.log('🪣 Creating storage bucket "exports"...');
  const { data, error } = await supabase.storage.createBucket('exports', {
    public: true,
    allowedMimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
  });

  if (error) {
    console.error('❌ Failed to create bucket:', error.message);
  } else {
    console.log('✅ Bucket "exports" created successfully!', data);
  }
}

run();
