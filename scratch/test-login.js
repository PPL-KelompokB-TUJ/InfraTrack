import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fgcunyebdabjvzgiaidc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const ahmadPasswords = [
  'Ahmad123!@#', 'Ahmad123', 'ahmad123', 'petugas123', 'petugas', '1234', '123456', '12345678', 'password',
  'Tuj123', 'Tuj123!@#', 'tuj123', 'infratrack123', 'Infratrack123', 'ahmad.sutrisno'
];

const saepPasswords = [
  'Saep123!@#', 'Saep123', 'saep123', 'saep', 'petugassaep', '1234', '123456', '12345678', 'password',
  'Tuj123', 'Tuj123!@#', 'tuj123', 'infratrack123', 'Infratrack123'
];

async function run() {
  console.log('--- Testing Petugas Ahmad ---');
  for (const pw of ahmadPasswords) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'petugas.ahmad@infratrack.local',
      password: pw,
    });
    if (!error) {
      console.log(`✅ SUCCESS Ahmad! Password is: "${pw}"`);
      await supabase.auth.signOut();
      break;
    }
  }

  console.log('--- Testing Petugas Saep ---');
  for (const pw of saepPasswords) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'petugassaep@gmail.com',
      password: pw,
    });
    if (!error) {
      console.log(`✅ SUCCESS Saep! Password is: "${pw}"`);
      await supabase.auth.signOut();
      break;
    }
  }
}

run();
