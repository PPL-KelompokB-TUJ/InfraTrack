import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertTasks() {
  const { data: r1 } = await supabase.from('damage_reports').select('id').eq('ticket_code', 'INF-20241003-8821').single();
  const { data: r2 } = await supabase.from('damage_reports').select('id').eq('ticket_code', 'INF-20241007-8940').single();
  const { data: r3 } = await supabase.from('damage_reports').select('id').eq('ticket_code', 'INF-20241015-9221').single();

  const tasks = [];
  if (r1) tasks.push({ report_id: r1.id, scheduled_date: '2024-10-03T08:00:00+07:00', estimated_cost: 5000000, status: 'assigned' });
  if (r2) tasks.push({ report_id: r2.id, scheduled_date: '2024-10-07T11:30:00+07:00', estimated_cost: 2000000, status: 'assigned' });
  if (r3) tasks.push({ report_id: r3.id, scheduled_date: '2024-10-15T14:00:00+07:00', estimated_cost: 1000000, status: 'assigned' });

  const { error } = await supabase.from('maintenance_tasks').insert(tasks);
  if (error) console.error("Error inserting tasks:", error);
  else console.log("Tasks inserted successfully!");
}

insertTasks();
