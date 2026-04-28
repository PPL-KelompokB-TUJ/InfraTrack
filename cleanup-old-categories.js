import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function cleanupOldCategories() {
  try {
    console.log('🧹 Cleaning up old categories...\n');

    const oldCategories = ['Ayam goreng', 'Fasilitas Umum', 'Fasum'];
    
    for (const cat of oldCategories) {
      const { error } = await supabase
        .from('infrastructure_categories')
        .delete()
        .eq('name', cat);

      if (!error) {
        console.log(`   ✅ Deleted: ${cat}`);
      } else {
        console.log(`   ℹ️  ${cat} (not found or error)`);
      }
    }

    // Verify final state
    console.log('\n✅ Final categories in database:');
    const { data: categories } = await supabase
      .from('infrastructure_categories')
      .select('name, is_default, is_active')
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true });

    categories?.forEach(cat => {
      const badge = cat.is_default ? '⭐' : '  ';
      console.log(`   ${badge} ${cat.name}`);
    });
    
    console.log('\n✨ Cleanup complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

cleanupOldCategories();
