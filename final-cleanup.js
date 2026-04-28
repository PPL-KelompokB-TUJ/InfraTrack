import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function deleteSpecificIds() {
  try {
    const toDeleteIds = [
      '8ac666ab-da9e-4e6b-8ef5-b98d53183779', // Fasilitas Umum
      '691709e9-d3dd-467f-ae4b-f3d0f4e3df2f'  // Fasum
    ];

    for (const id of toDeleteIds) {
      await supabase
        .from('infrastructure_categories')
        .delete()
        .eq('id', id);
      console.log(`✅ Deleted id: ${id}`);
    }

    // Show final
    const { data } = await supabase
      .from('infrastructure_categories')
      .select('name')
      .order('name');
    
    console.log('\n✨ Final categories:');
    data?.forEach(cat => console.log(`   ${cat.name}`));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

deleteSpecificIds();
