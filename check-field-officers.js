#!/usr/bin/env node
/**
 * Check field officer data in public.users table
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseAdminKey);

const fieldOfficerEmails = [
  'ahmad.sutrisno@example.com',
  'budi.santoso@example.com',
  'citra.dewi@example.com',
];

async function checkFieldOfficers() {
  console.log('📋 Checking field officers in public.users table...\n');

  try {
    // Check public.users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .in('email', fieldOfficerEmails);

    if (usersError) {
      console.error('❌ Error querying public.users:', usersError.message);
      return;
    }

    console.log(`📊 Found ${users.length} field officers in public.users:\n`);
    
    users.forEach(user => {
      console.log(`Email: ${user.email}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Active: ${user.is_active}`);
      console.log(`  ID: ${user.id}`);
      console.log('');
    });

    // Check Supabase Auth
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('📋 Checking Supabase Auth users...\n');

    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error querying auth users:', authError.message);
      return;
    }

    fieldOfficerEmails.forEach(email => {
      const authUser = authData.users.find(u => u.email === email);
      const pubUser = users.find(u => u.email === email);

      console.log(`\n${email}:`);
      
      if (!authUser) {
        console.log('  ❌ NO auth user');
      } else {
        console.log(`  ✅ Auth user found`);
        console.log(`     app_metadata.role: ${authUser.app_metadata?.role || 'none'}`);
        console.log(`     user_metadata: ${JSON.stringify(authUser.user_metadata)}`);
      }

      if (!pubUser) {
        console.log('  ❌ NO public.users entry');
      } else {
        console.log(`  ✅ public.users entry found`);
        console.log(`     role: ${pubUser.role}`);
        console.log(`     is_active: ${pubUser.is_active}`);
      }
    });

    console.log('\n═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('Fatal error:', error);
  }
}

checkFieldOfficers();
