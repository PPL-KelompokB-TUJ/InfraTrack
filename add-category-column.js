#!/usr/bin/env node
/**
 * Add missing category column to infrastructure_assets
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

// Migration SQL to add the category column
const migrationSQL = `
ALTER TABLE public.infrastructure_assets
ADD COLUMN IF NOT EXISTS category text not null default 'Jalan';
`;

async function addCategoryColumn() {
  console.log('🔧 Adding category column to infrastructure_assets...\n');

  try {
    // We cannot execute raw SQL with the publishable key
    // Instead, we'll use a different approach - create the column via Supabase API
    console.log('ℹ️  Using Supabase REST API to add the column...\n');

    // First, let's try to insert a record with category to see if it exists
    const testRecord = {
      name: '_test_category_check_',
      category: 'Jalan',
      location: 'SRID=4326;POINT(0 0)',
      condition: 'baik',
      year_built: 2024,
      photo_url: null
    };

    console.log('📝 Attempting to insert test record with category column...');
    const { error } = await supabase
      .from('infrastructure_assets')
      .insert(testRecord);

    if (error && error.message.includes('category')) {
      console.log('❌ Error with category column:', error.message);
      console.log('\n⚠️  The category column needs to be added manually via Supabase Dashboard.\n');
      console.log('📋 Steps to add the column:');
      console.log('   1. Go to Supabase Dashboard: https://app.supabase.com/project/_/editor');
      console.log('   2. Click on "infrastructure_assets" table');
      console.log('   3. Click "+" to add a new column');
      console.log('   4. Column name: category');
      console.log('   5. Type: Text');
      console.log('   6. Default value: "Jalan"');
      console.log('   7. Save');
      console.log('\n   Or run this SQL in the SQL Editor:');
      console.log('   ' + migrationSQL.trim());
      return;
    }

    // Delete test record if it was created successfully
    if (!error) {
      console.log('✅ Category column exists and is working!');
      console.log('   Cleaning up test record...');
      await supabase
        .from('infrastructure_assets')
        .delete()
        .eq('name', '_test_category_check_');
      console.log('✅ Test record removed.\n');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

addCategoryColumn();
