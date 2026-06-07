import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fgcunyebdabjvzgiaidc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Logging in...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'ahmad.sutrisno@example.com',
    password: 'Ahmad123!@#',
  });

  if (authError) {
    console.error('Auth Error:', authError.message);
    return;
  }

  console.log('Logged in successfully. User ID:', authData.user.id);
  console.log('Access token length:', authData.session.access_token.length);

  // 1. Fetch users
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, name, email, role, is_active');
  if (usersError) {
    console.error('Users Error:', usersError.message);
  } else {
    console.log(`Fetched ${users.length} users:`);
    console.table(users);
  }

  // 2. Fetch field officers view
  const { data: officers, error: officersError } = await supabase
    .from('field_officers_view')
    .select('id, name, email');
  if (officersError) {
    console.error('Officers View Error:', officersError.message);
  } else {
    console.log(`Fetched ${officers.length} officers from view:`);
    console.table(officers);
  }

  // 3. Fetch tasks
  const { data: tasks, error: tasksError } = await supabase
    .from('maintenance_tasks')
    .select('id, assigned_to, status, scheduled_date');
  if (tasksError) {
    console.error('Tasks Error:', tasksError.message);
  } else {
    console.log(`Fetched ${tasks.length} tasks:`);
    if (tasks.length > 0) {
      console.log('Sample task fields:');
      console.log(Object.keys(tasks[0]));
      console.log('Unique assigned_to in tasks:');
      console.log([...new Set(tasks.map(t => t.assigned_to))]);
    }
  }
}

run();
