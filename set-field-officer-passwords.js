#!/usr/bin/env node
/**
 * Set passwords for field officer accounts in Supabase Auth
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseAdminKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAdminKey);

const fieldOfficers = [
  {
    email: 'ahmad.sutrisno@example.com',
    password: 'Ahmad123!@#',
  },
  {
    email: 'budi.santoso@example.com',
    password: 'Budi123!@#',
  },
  {
    email: 'citra.dewi@example.com',
    password: 'Citra123!@#',
  },
];

async function setFieldOfficerPasswords() {
  console.log('🔐 Setting field officer passwords...\n');

  try {
    // Get all users
    const { data: authData, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) throw listError;

    let updated = 0;
    let failed = 0;

    for (const officer of fieldOfficers) {
      const user = authData.users.find(u => u.email === officer.email);
      
      if (!user) {
        console.log(`❌ ${officer.email} - NOT FOUND in Supabase Auth`);
        failed++;
        continue;
      }

      console.log(`⏳ ${officer.email}`);
      console.log(`   Setting password: ${officer.password}`);

      const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        password: officer.password,
      });

      if (updateError) {
        console.log(`   ❌ Error: ${updateError.message}`);
        failed++;
      } else {
        console.log(`   ✅ Password set successfully`);
        updated++;
      }
      console.log('');
    }

    console.log('════════════════════════════════════════════════════════');
    console.log(`✅ Updated: ${updated}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('════════════════════════════════════════════════════════\n');

    if (updated === 3) {
      console.log('🎉 All passwords set! You can now login with:\n');
      
      fieldOfficers.forEach(officer => {
        console.log(`📧 ${officer.email}`);
        console.log(`🔐 ${officer.password}\n`);
      });

      console.log('Test steps:');
      console.log('1. Open InfraTrack');
      console.log('2. Click "🚗 Petugas" button');
      console.log('3. Enter email and password above');
      console.log('4. Click "Masuk"\n');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

setFieldOfficerPasswords();
