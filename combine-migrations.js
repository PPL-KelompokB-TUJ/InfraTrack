#!/usr/bin/env node
/**
 * Combine all SQL migrations in correct order
 * Output: migration-complete.sql yang ready untuk dipaste di Supabase SQL Editor
 */

import fs from 'fs';
import path from 'path';

const migrations = [
  'create_infrastructure_assets.sql',
  'setup_assets_photos_storage.sql',
  'create_damage_reports.sql',
  'setup_damage_reports_storage.sql',
  'create_maintenance_tasks.sql',
];

const supabasePath = path.join(process.cwd(), 'supabase');
let combinedSQL = '';

console.log('📦 Combining SQL migrations in correct order...\n');

for (const filename of migrations) {
  const filepath = path.join(supabasePath, filename);
  
  try {
    const sql = fs.readFileSync(filepath, 'utf-8');
    
    combinedSQL += `\n-- ============================================\n`;
    combinedSQL += `-- File: ${filename}\n`;
    combinedSQL += `-- ============================================\n\n`;
    combinedSQL += sql;
    combinedSQL += `\n`;
    
    console.log(`✅ Added: ${filename}`);
  } catch (error) {
    console.error(`❌ Error reading ${filename}:`, error.message);
  }
}

// Write combined SQL to file
const outputPath = path.join(process.cwd(), 'supabase', 'migration-complete.sql');
fs.writeFileSync(outputPath, combinedSQL);

console.log(`\n✨ Combined SQL file created: supabase/migration-complete.sql`);
console.log(`\n📋 Instructions:`);
console.log(`1. Open Supabase Dashboard > SQL Editor`);
console.log(`2. Click "+ New query"`);
console.log(`3. Open file: supabase/migration-complete.sql`);
console.log(`4. Copy all content (Ctrl+A, Ctrl+C)`);
console.log(`5. Paste into Supabase SQL Editor`);
console.log(`6. Click "Run" button`);
console.log(`7. Wait for completion`);
console.log(`\n✅ All migrations will be executed!`);
