import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fgcunyebdabjvzgiaidc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const accounts = [
  { email: 'petugas.ahmad@infratrack.local', name: 'Ahmad' },
  { email: 'prasteguh@gmail.com', name: 'Pras' },
  { email: 'petugasbondan@gmail.com', name: 'Bondan' }
];

const passwords = [
  'Admin@1234',
  'Petugas@1234',
  'Ahmad@1234',
  'Pras@1234',
  'Bondan@1234',
  'petugas@1234',
  'ahmad@1234',
  'pras@1234',
  'bondan@1234',
  '1234',
  'password',
  'Petugas123',
  'petugas123',
  'Ahmad123',
  'ahmad123'
];

async function run() {
  for (const account of accounts) {
    console.log(`\nTesting account: ${account.email} (${account.name})`);
    for (const pw of passwords) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: pw
      });
      if (!error) {
        console.log(`✅ SUCCESS! ${account.email} -> password is: "${pw}"`);
        await supabase.auth.signOut();
        return;
      }
    }
  }
  console.log('\n❌ No matching password found.');
}

run();
