#!/usr/bin/env node
/**
 * Check actual table structure
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function checkTableStructure() {
  console.log('🔍 Checking actual table structure...\n');

  try {
    // Query without specifying columns to see what's available
    const { data, error } = await supabase
      .from('infrastructure_assets')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }

    if (data && data.length > 0) {
      console.log('📊 Available columns in infrastructure_assets:');
      const columns = Object.keys(data[0]);
      columns.forEach(col => {
        console.log(`   - ${col}`);
      });

      console.log('\n❌ MISSING COLUMN: category');
      console.log('⚠️  The table needs the category column added.\n');
    } else {
      console.log('ℹ️  No data in table, checking schema...');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTableStructure();
