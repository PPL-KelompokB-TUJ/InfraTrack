import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fgcunyebdabjvzgiaidc.supabase.co';
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ADMIN_KEY;

console.log('supabaseUrl:', supabaseUrl);
console.log('Admin key exists:', !!supabaseAdminKey);

if (supabaseAdminKey) {
  const supabase = createClient(supabaseUrl, supabaseAdminKey);
  
  async function run() {
    try {
      console.log('\n--- Querying with Admin privileges ---');
      const { data: tasks, error: tasksError } = await supabase
        .from('maintenance_tasks')
        .select(`
          id,
          assigned_to,
          status,
          instructions,
          officer:assigned_to (id, name, email)
        `);
      if (tasksError) throw tasksError;

      console.log('Total tasks in maintenance_tasks:', tasks.length);
      
      const counts = {};
      tasks.forEach(t => {
        const name = t.officer?.name || t.assigned_to || 'unassigned';
        counts[name] = (counts[name] || 0) + 1;
      });
      console.log('Tasks by officer:', counts);
      
      if (tasks.length > 0) {
        console.log('Sample tasks:', tasks.slice(0, 3));
      }
    } catch (e) {
      console.error(e);
    }
  }
  run();
} else {
  console.log('No admin key available in environment variables.');
}
