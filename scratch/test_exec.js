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

  console.log('⚡ Attempting to execute SQL migration via RPC "exec"...');
  
  const sql = `
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'exports', 
      'exports', 
      true, 
      52428800, -- 50 MB
      ARRAY[
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]
    )
    ON CONFLICT (id) DO NOTHING;

    DROP POLICY IF EXISTS "Allow authenticated upload to exports" ON storage.objects;
    DROP POLICY IF EXISTS "Allow public read from exports" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated delete from exports" ON storage.objects;

    CREATE POLICY "Allow authenticated upload to exports"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'exports');

    CREATE POLICY "Allow public read from exports"
      ON storage.objects FOR SELECT TO public
      USING (bucket_id = 'exports');

    CREATE POLICY "Allow authenticated delete from exports"
      ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'exports');
  `;

  const { data, error } = await supabase.rpc('exec', { command: sql });

  if (error) {
    console.error('❌ RPC "exec" failed:', error.message);
  } else {
    console.log('✅ SQL migration executed successfully via RPC!', data);
  }
}

run();
