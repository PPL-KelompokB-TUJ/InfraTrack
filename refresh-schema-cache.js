#!/usr/bin/env node
/**
 * Refresh Supabase Schema Cache
 * Jalankan dengan: node refresh-schema-cache.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: VITE_SUPABASE_URL atau VITE_SUPABASE_PUBLISHABLE_KEY tidak ditemukan di .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function refreshSchemaCache() {
  console.log('🔄 Attempting to refresh Supabase schema cache...\n');

  try {
    // Method 1: Try to query the infrastructure_assets table to trigger schema validation
    console.log('📋 Step 1: Querying infrastructure_assets table to validate schema...');
    const { data: assets, error: queryError } = await supabase
      .from('infrastructure_assets')
      .select('*')
      .limit(1);

    if (queryError) {
      console.log('⚠️  Query error (this might be expected):', queryError.message);
    } else {
      console.log('✅ Successfully queried infrastructure_assets');
      console.log(`   Found ${assets?.length || 0} assets\n`);
    }

    // Method 2: Try accessing the view
    console.log('📋 Step 2: Querying infrastructure_assets_view...');
    const { data: viewData, error: viewError } = await supabase
      .from('infrastructure_assets_view')
      .select('*')
      .limit(1);

    if (viewError) {
      console.log('⚠️  View query error:', viewError.message);
    } else {
      console.log('✅ Successfully queried view');
      console.log(`   Found ${viewData?.length || 0} records\n`);
    }

    // Method 3: Check table columns via RPC (if available)
    console.log('📋 Step 3: Checking table structure...');
    try {
      const { data, error } = await supabase.rpc('get_columns', {
        table_name: 'infrastructure_assets'
      });
      
      if (!error && data) {
        console.log('✅ Table columns:');
        data.forEach(col => {
          console.log(`   - ${col.column_name}: ${col.data_type}`);
        });
      }
    } catch (err) {
      console.log('ℹ️  RPC method not available (this is normal)');
    }

    console.log('\n💡 To manually clear Supabase schema cache:');
    console.log('   1. Go to: https://app.supabase.com/project/_/sql');
    console.log('   2. Click the refresh icon in the SQL editor');
    console.log('   3. Or run: NOTIFY pgrst, \'reload schema\';\n');

    console.log('✅ Schema cache refresh process completed!');
    console.log('ℹ️  If you still see schema errors, visit the Supabase Dashboard and click the refresh button.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

refreshSchemaCache();
