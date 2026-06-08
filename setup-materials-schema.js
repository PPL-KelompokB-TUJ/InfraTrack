#!/usr/bin/env node
import fs from 'fs';

function setupMaterialsSchema() {
  console.log('📊 Materials and Usages Schema Setup\n');
  console.log('⚠️  MANUAL SETUP REQUIRED\n');
  
  try {
    const sql = fs.readFileSync('./supabase/CREATE_MATERIALS_AND_USAGES.sql', 'utf-8');
    
    console.log('📋 SQL Script Generated. Please:\n');
    console.log('1. Open Supabase Dashboard');
    console.log('2. Go to SQL Editor');
    console.log('3. Create new query');
    console.log('4. Paste the SQL below');
    console.log('5. Click "Run"\n');
    console.log('════════════════════════════════════════════════════════\n');
    console.log(sql);
    console.log('\n════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setupMaterialsSchema();
