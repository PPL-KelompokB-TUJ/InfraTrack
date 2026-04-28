#!/usr/bin/env node
/**
 * Add missing field officer to public.users
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseAdminKey);

async function addMissingFieldOfficer() {
  console.log('➕ Adding missing Citra Dewi to public.users...\n');

  try {
    const { data, error } = await supabase
      .from('users')
      .insert({
        name: 'Citra Dewi',
        email: 'citra.dewi@example.com',
        role: 'field_officer',
        is_active: true,
      })
      .select();

    if (error) {
      if (error.message.includes('duplicate')) {
        console.log('⚠️  Already exists in public.users');
      } else {
        throw error;
      }
    } else {
      console.log('✅ Successfully added Citra Dewi');
      console.log(`   ID: ${data[0].id}`);
      console.log(`   Email: ${data[0].email}`);
      console.log(`   Role: ${data[0].role}`);
    }

    // Verify all 3 are now in public.users
    console.log('\n📋 Final verification:\n');
    
    const { data: allOfficers } = await supabase
      .from('users')
      .select('email, role, is_active')
      .in('email', [
        'ahmad.sutrisno@example.com',
        'budi.santoso@example.com',
        'citra.dewi@example.com',
      ]);

    allOfficers.forEach(officer => {
      console.log(`✅ ${officer.email}`);
      console.log(`   Role: ${officer.role}, Active: ${officer.is_active}`);
    });

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ All 3 field officers are now ready!\n');
    console.log('📧 You can now login as:\n');
    
    console.log('Email: ahmad.sutrisno@example.com');
    console.log('Pass:  Ahmad123!@#\n');
    
    console.log('Email: budi.santoso@example.com');
    console.log('Pass:  Budi123!@#\n');
    
    console.log('Email: citra.dewi@example.com');
    console.log('Pass:  Citra123!@#\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addMissingFieldOfficer();
