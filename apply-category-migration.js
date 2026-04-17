#!/usr/bin/env node
/**
 * Apply category column migration with admin key
 * Usage: SUPABASE_ADMIN_KEY=your_key node apply-category-migration.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
let supabaseAdminKey = process.env.SUPABASE_ADMIN_KEY;

if (!supabaseUrl) {
  console.error('❌ VITE_SUPABASE_URL not found in .env');
  process.exit(1);
}

// If no admin key provided, ask for it
if (!supabaseAdminKey) {
  console.log('⚠️  SUPABASE_ADMIN_KEY not found in environment.\n');
  console.log('📌 To get your admin key:');
  console.log('   1. Go to: https://app.supabase.com/project/fgcunyebdabjvzgiaidc/settings/api');
  console.log('   2. Copy "service_role" (the SECRET key, not the public one)');
  console.log('   3. Run: SUPABASE_ADMIN_KEY=your_key node apply-category-migration.js\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Enter your Supabase admin key (or press Ctrl+C to exit): ', (key) => {
    rl.close();
    applyMigration(key.trim());
  });
} else {
  applyMigration(supabaseAdminKey);
}

async function applyMigration(adminKey) {
  if (!adminKey) {
    console.error('❌ Admin key is required');
    process.exit(1);
  }

  console.log('🔑 Connecting to Supabase with admin key...\n');

  const supabase = createClient(supabaseUrl, adminKey);

  try {
    console.log('📝 Executing migration: ALTER TABLE infrastructure_assets ADD COLUMN category...\n');

    const { data, error } = await supabase.rpc('exec', {
      command: `ALTER TABLE public.infrastructure_assets
ADD COLUMN IF NOT EXISTS category text not null default 'Jalan';`
    });

    if (error) {
      // Try alternative approach
      console.log('ℹ️  RPC method not available, trying raw SQL query...\n');

      // This won't work with publishable key, but let's try
      const { error: altError } = await supabase
        .from('infrastructure_assets')
        .select('category')
        .limit(1);

      if (altError && altError.message.includes('category')) {
        throw new Error('Category column still missing');
      }

      throw error;
    }

    console.log('✅ Migration completed successfully!\n');
    console.log('📋 Verifying column...\n');

    // Verify the column exists
    const { data: columns, error: verifyError } = await supabase
      .from('infrastructure_assets')
      .select('id, name, category')
      .limit(1);

    if (verifyError) {
      throw verifyError;
    }

    console.log('✅ Category column is now available!');
    console.log('   You can now use the application without errors.\n');

  } catch (err) {
    console.error('❌ Error:', err.message || err);
    console.log('\n💡 Alternative: Apply the migration manually');
    console.log('   Go to: https://app.supabase.com/project/fgcunyebdabjvzgiaidc/sql');
    console.log('   Run the SQL from: supabase/ADD_CATEGORY_COLUMN.sql');
    process.exit(1);
  }
}
