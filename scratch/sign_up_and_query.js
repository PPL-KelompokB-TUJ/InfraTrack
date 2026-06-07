import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fgcunyebdabjvzgiaidc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const email = 'admin@infratrack.id';
  const password = 'Admin@1234';

  console.log(`Logging in as admin: ${email}...`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    console.error('Auth Error:', authError.message);
    return;
  }

  console.log('Logged in successfully. User ID:', authData.user.id);

  // Fetch users
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, name, email, role, is_active');
  if (usersError) {
    console.error('Users Error:', usersError.message);
  } else {
    console.log(`Fetched ${users.length} users:`);
    console.table(users);
  }

  // Fetch field officers view
  const { data: officers, error: officersError } = await supabase
    .from('field_officers_view')
    .select('id, name, email');
  if (officersError) {
    console.error('Officers View Error:', officersError.message);
  } else {
    console.log(`Fetched ${officers.length} officers from view:`);
    console.table(officers);
  }

  // Fetch tasks
  const { data: tasks, error: tasksError } = await supabase
    .from('maintenance_tasks')
    .select('id, assigned_to, status, scheduled_date');
  if (tasksError) {
    console.error('Tasks Error:', tasksError.message);
  } else {
    console.log(`Fetched ${tasks.length} tasks:`);
    if (tasks.length > 0) {
      console.log('Unique assigned_to in tasks:');
      console.log([...new Set(tasks.map(t => t.assigned_to))]);
      console.log('Sample tasks:', tasks.slice(0, 5));
      
      // Group by assigned_to
      const counts = {};
      tasks.forEach(t => {
        counts[t.assigned_to] = (counts[t.assigned_to] || 0) + 1;
      });
      console.log('Tasks count per user ID:');
      console.log(counts);
    }
  }

  // Clean up
  await supabase.auth.signOut();
}

run();
