import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function forceCleanup() {
  try {
    console.log('🔧 Force cleanup old categories...\n');

    // Get all categories to see what we have
    console.log('Current categories:');
    const { data: allCats } = await supabase
      .from('infrastructure_categories')
      .select('id, name, is_active');
    
    allCats?.forEach(cat => {
      console.log(`   - ${cat.name} (id: ${cat.id}, active: ${cat.is_active})`);
    });

    // Delete the unwanted ones by ID
    const toDelete = ['Fasum', 'Fasilitas Umum', 'Ayam goreng'];
    
    for (const name of toDelete) {
      const cat = allCats?.find(c => c.name === name);
      if (cat) {
        const { error } = await supabase
          .from('infrastructure_categories')
          .delete()
          .eq('id', cat.id);
        
        if (!error) {
          console.log(`   ✅ Deleted ${name}`);
        }
      }
    }

    console.log('\n📋 Final categories:');
    const { data: final } = await supabase
      .from('infrastructure_categories')
      .select('name, is_default, is_active')
      .order('name');
    
    final?.forEach(cat => {
      const star = cat.is_default ? '⭐ ' : '   ';
      console.log(`${star}${cat.name}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
}

forceCleanup();
