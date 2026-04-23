#!/usr/bin/env node
/**
 * Fix field officer roles in Supabase Auth
 * Updates app_metadata with field_officer role for existing users
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fgcunyebdabjvzgiaidc.supabase.co';
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseAdminKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAdminKey);

const fieldOfficerEmails = [
  'ahmad.sutrisno@example.com',
  'budi.santoso@example.com',
  'citra.dewi@example.com',
];

async function fixFieldOfficerRoles() {
  console.log('🔧 Fixing field officer roles...\n');

  try {
    // Get all users
    const { data: userData, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) throw listError;

    const users = userData.users;
    console.log(`📊 Found ${users.length} total users in Supabase Auth\n`);

    let updated = 0;
    let skipped = 0;

    for (const email of fieldOfficerEmails) {
      const user = users.find(u => u.email === email);
      
      if (!user) {
        console.log(`⚠️  ${email} - NOT FOUND in Supabase Auth`);
        skipped++;
        continue;
      }

      const currentRole = user.app_metadata?.role;
      
      if (currentRole === 'field_officer') {
        console.log(`✅ ${email} - Already has field_officer role`);
        continue;
      }

      console.log(`⏳ ${email}`);
      console.log(`   Current role: ${currentRole || 'none'}`);
      console.log(`   Updating to: field_officer`);

      const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        app_metadata: {
          role: 'field_officer',
        },
      });

      if (updateError) {
        console.log(`   ❌ Error: ${updateError.message}`);
        skipped++;
      } else {
        console.log(`   ✅ Updated successfully`);
        updated++;
      }
    }

    console.log('\n════════════════════════════════════════════════════════');
    console.log(`✅ Updated: ${updated}`);
    console.log(`⚠️  Skipped: ${skipped}`);
    console.log('════════════════════════════════════════════════════════\n');

    console.log('🧪 TEST LOGIN NOW:\n');
    fieldOfficerEmails.forEach((email) => {
      const name = email.split('@')[0].split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      let password = '';
      
      if (email === 'ahmad.sutrisno@example.com') password = 'Ahmad123!@#';
      if (email === 'budi.santoso@example.com') password = 'Budi123!@#';
      if (email === 'citra.dewi@example.com') password = 'Citra123!@#';

      console.log(`📧 ${email}`);
      console.log(`🔐 ${password}\n`);
    });

    console.log('Steps:');
    console.log('1. Open InfraTrack in browser');
    console.log('2. Click "🚗 Petugas" button');
    console.log('3. Enter email and password above');
    console.log('4. Click "Masuk"\n');

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

fixFieldOfficerRoles();
