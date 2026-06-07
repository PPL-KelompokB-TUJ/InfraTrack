import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fgcunyebdabjvzgiaidc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const email = 'admin@infratrack.id';
  const password = 'Admin@1234';

  const { data: authData } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // 1. Fetch active field officers from the view
  const { data: officers } = await supabase
    .from('field_officers_view')
    .select('id, name, email, specialization, work_area');

  // 2. Fetch all maintenance tasks
  const { data: tasks } = await supabase
    .from('maintenance_tasks')
    .select('id, assigned_to, status, scheduled_date');

  console.log('Officers:');
  console.log(officers);

  console.log('\nTasks sample:');
  console.log(tasks.slice(0, 3));

  console.log('\nComparisons:');
  officers.forEach(officer => {
    const officerTasks = (tasks || []).filter(t => t.assigned_to === officer.id);
    console.log(`Officer: ${officer.name} (${officer.id})`);
    console.log(`- Filtered tasks count: ${officerTasks.length}`);
    if (officerTasks.length > 0) {
      console.log(`  - Sample assigned_to: ${officerTasks[0].assigned_to}`);
    }
  });

  await supabase.auth.signOut();
}

run();
