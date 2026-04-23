import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env file
dotenv.config({ path: path.join(__dirname, '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ SUPABASE_URL or SUPABASE_KEY not found in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function updateCategories() {
  try {
    console.log('🔄 Updating infrastructure categories...\n');

    // Delete old categories that are not in the new list
    console.log('🗑️  Removing old categories (Fasum, Ayam goreng)...');
    const { error: deleteError } = await supabase
      .from('infrastructure_categories')
      .delete()
      .in('name', ['Fasum', 'Ayam goreng', 'Ayam Goreng']);

    if (deleteError) {
      console.log('   (No old categories found or already deleted)');
    } else {
      console.log('   ✅ Old categories removed');
    }

    // Insert new categories
    console.log('\n📌 Adding new categories...');
    const newCategories = [
      { name: 'Jalan', is_default: false, is_active: true },
      { name: 'Jembatan', is_default: false, is_active: true },
      { name: 'Saluran Drainase', is_default: false, is_active: true },
      { name: 'Air Bersih', is_default: false, is_active: true },
      { name: 'Listrik', is_default: false, is_active: true }
    ];

    for (const category of newCategories) {
      const { error } = await supabase
        .from('infrastructure_categories')
        .upsert(
          { name: category.name, is_default: category.is_default, is_active: category.is_active },
          { onConflict: 'name' }
        );

      if (error) {
        console.error(`   ❌ Error upserting ${category.name}:`, error.message);
      } else {
        console.log(`   ✅ ${category.name}`);
      }
    }

    // Set Jalan as default if no default exists
    console.log('\n⭐ Setting default category...');
    const { data: existingDefault } = await supabase
      .from('infrastructure_categories')
      .select('id')
      .eq('is_default', true)
      .limit(1);

    if (!existingDefault || existingDefault.length === 0) {
      const { error } = await supabase
        .from('infrastructure_categories')
        .update({ is_default: true })
        .eq('name', 'Jalan');

      if (!error) {
        console.log('   ✅ Set Jalan as default category');
      }
    } else {
      console.log('   (Default already exists)');
    }

    // Verify categories
    console.log('\n📋 Current categories in database:');
    const { data: categories, error: fetchError } = await supabase
      .from('infrastructure_categories')
      .select('name, is_default, is_active')
      .order('is_default', { ascending: false })
      .order('name', { ascending: true });

    if (fetchError) {
      console.error('   ❌ Error fetching categories:', fetchError.message);
    } else {
      categories?.forEach(cat => {
        const badge = cat.is_default ? '⭐' : '  ';
        const status = cat.is_active ? '✓' : '✗';
        console.log(`   ${badge} ${cat.name} [${status}]`);
      });
    }

    console.log('\n✅ Categories updated successfully!\n');
  } catch (error) {
    console.error('❌ Error updating categories:', error.message);
    process.exit(1);
  }
}

updateCategories();
