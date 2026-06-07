import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fgcunyebdabjvzgiaidc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function run() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Logging in...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@infratrack.id',
    password: 'Admin@1234'
  });

  if (authError) {
    console.error('Login error:', authError);
    return;
  }

  const token = authData.session.access_token;
  console.log('Login successful. Token:', token.substring(0, 15) + '...');

  // Now emulate getSupabaseClient(token) behavior
  console.log('\n--- Test 1: getUser() with options.global.headers ---');
  const client1 = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  try {
    const { data: { user }, error } = await client1.auth.getUser();
    if (error) {
      console.error('Test 1 error:', error);
    } else {
      console.log('Test 1 user email:', user?.email);
    }
  } catch (e) {
    console.error('Test 1 catch error:', e);
  }

  console.log('\n--- Test 2: getUser(token) ---');
  const client2 = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });

  try {
    const { data: { user }, error } = await client2.auth.getUser(token);
    if (error) {
      console.error('Test 2 error:', error);
    } else {
      console.log('Test 2 user email:', user?.email);
    }
  } catch (e) {
    console.error('Test 2 catch error:', e);
  }
}

run();
