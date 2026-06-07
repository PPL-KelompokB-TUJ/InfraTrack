import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fgcunyebdabjvzgiaidc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Logging in as Admin...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@infratrack.id',
    password: 'Admin@1234'
  });

  if (authError) {
    console.error('Auth Error:', authError.message);
    return;
  }

  const authUser = authData.user;
  console.log('Auth User ID:', authUser.id);
  console.log('Auth User Email:', authUser.email);
  console.log('Auth User App Metadata:', JSON.stringify(authUser.app_metadata));
  console.log('Auth User Metadata:', JSON.stringify(authUser.user_metadata));

  // Query public.users table
  const { data: publicUser, error: publicError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (publicError) {
    console.error('Public Users Table Error:', publicError.message);
    
    // Search public.users by email instead
    const { data: publicUsersByEmail, error: emailError } = await supabase
      .from('users')
      .select('*')
      .eq('email', authUser.email);
    console.log('Search by email in public.users:', publicUsersByEmail);
  } else {
    console.log('Found in public.users table:', publicUser);
  }

  await supabase.auth.signOut();
}

run();
