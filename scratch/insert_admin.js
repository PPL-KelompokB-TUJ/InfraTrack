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
  console.log('Inserting admin into public.users:');
  console.log('ID:', authUser.id);
  console.log('Email:', authUser.email);
  console.log('Name:', authUser.user_metadata?.name || 'Pandhu');

  const { data, error } = await supabase
    .from('users')
    .insert({
      id: authUser.id,
      name: authUser.user_metadata?.name || 'Pandhu',
      email: authUser.email,
      role: 'admin',
      is_active: true
    })
    .select();

  if (error) {
    console.error('Error inserting user:', error.message);
  } else {
    console.log('Successfully inserted user:', data);
  }

  await supabase.auth.signOut();
}

run();
