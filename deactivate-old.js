import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function deactivateOldCategories() {
  try {
    console.log('🔒 Deactivating old categories...\n');

    const toDeactivate = ['Fasilitas Umum', 'Fasum'];

    for (const name of toDeactivate) {
      const { error } = await supabase
        .from('infrastructure_categories')
        .update({ is_active: false })
        .eq('name', name);
      
      if (!error) {
        console.log(`✅ Deactivated: ${name}`);
      }
    }

    // Show active categories
    const { data } = await supabase
      .from('infrastructure_categories')
      .select('name, is_default, is_active')
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('name');
    
    console.log('\n✨ Active categories:');
    data?.forEach(cat => {
      const star = cat.is_default ? '⭐ ' : '   ';
      console.log(`${star}${cat.name}`);
    });

    console.log('\n✅ Done!');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

deactivateOldCategories();
