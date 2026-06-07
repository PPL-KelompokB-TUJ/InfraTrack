import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fgcunyebdabjvzgiaidc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    // We can fetch users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, role, is_active');
    
    if (usersError) throw usersError;

    // Fetch tasks count group by assigned_to
    const { data: tasks, error: tasksError } = await supabase
      .from('maintenance_tasks')
      .select('id, assigned_to');

    if (tasksError) throw tasksError;

    const counts = {};
    for (const t of tasks) {
      const assigned = t.assigned_to || 'unassigned';
      counts[assigned] = (counts[assigned] || 0) + 1;
    }

    console.log('=== Active Field Officers & Task Counts ===');
    const officerCounts = users
      .filter(u => u.role === 'field_officer' && u.is_active)
      .map(u => ({
        Name: u.name,
        Email: u.email,
        ID: u.id,
        'Tasks Assigned': counts[u.id] || 0
      }));
    
    console.table(officerCounts);

    console.log('\n=== Inactive Field Officers & Task Counts ===');
    const inactiveCounts = users
      .filter(u => u.role === 'field_officer' && !u.is_active)
      .map(u => ({
        Name: u.name,
        Email: u.email,
        ID: u.id,
        'Tasks Assigned': counts[u.id] || 0
      }));
    
    console.table(inactiveCounts);

    console.log('\nUnassigned Tasks Count:', counts['unassigned'] || 0);
    console.log('Total Tasks Count:', tasks.length);

  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
