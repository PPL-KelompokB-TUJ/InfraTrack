#!/usr/bin/env node
/**
 * Verify infrastructure_assets schema including category column
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function verifyCategoryColumn() {
  console.log('🔍 Verifying infrastructure_assets schema...\n');

  try {
    // Query with category column specifically
    const { data, error } = await supabase
      .from('infrastructure_assets')
      .select('id, name, category, condition, year_built')
      .limit(1);

    if (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }

    console.log('✅ Successfully accessed columns:');
    console.log('   - id');
    console.log('   - name');
    console.log('   - category ✓');
    console.log('   - condition');
    console.log('   - year_built');

    if (data && data.length > 0) {
      console.log('\n📊 Sample data:');
      const sample = data[0];
      console.log(`   Category value: "${sample.category}"`);
      console.log(`   Name: "${sample.name}"`);
    }

    console.log('\n✅ Schema validation complete! The category column is working correctly.');
    console.log('🎉 You can now use the application without schema cache errors.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyCategoryColumn();
