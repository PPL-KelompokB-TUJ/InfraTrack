#!/usr/bin/env node
/**
 * Generate SQL migration to add category column
 * This script shows the exact SQL needed
 */

const migrationSQL = `-- Migration: Add category column to infrastructure_assets
-- This fixes the "Could not find the 'category' column" error

ALTER TABLE public.infrastructure_assets
ADD COLUMN IF NOT EXISTS category text not null default 'Jalan';

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'infrastructure_assets'
ORDER BY ordinal_position;
`;

console.log('📋 SQL Migration to Fix Schema Error\n');
console.log('Copy the SQL below and run it in Supabase SQL Editor:\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log(migrationSQL);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('✅ How to apply this migration:\n');
console.log('1. Go to: https://app.supabase.com/project/fgcunyebdabjvzgiaidc/sql');
console.log('2. Paste the SQL above into the SQL Editor');
console.log('3. Click "Run" or press Ctrl+Enter');
console.log('4. Wait for the query to complete');
console.log('5. Refresh your page or restart your application\n');

console.log('💾 Saving migration to file...');

import fs from 'fs';
fs.writeFileSync(
  'supabase/ADD_CATEGORY_COLUMN.sql',
  migrationSQL,
  'utf-8'
);

console.log('✅ Migration saved to: supabase/ADD_CATEGORY_COLUMN.sql\n');
