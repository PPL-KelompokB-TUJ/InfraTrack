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

async function seedMockupData() {
  console.log("Seeding mockup data...");

  // 1. Get first damage type for references
  const { data: dt } = await supabase.from('damage_types').select('id').limit(1).single();
  const damageTypeId = dt.id;

  // 2. We need 3 users to assign to (Budi Santoso, Siti Aminah, Agus Salim)
  // But assigned_officer is a UUID from auth.users. 
  // Let's just create 3 dummy officers in our field_officers table if needed, OR just use any existing officer, 
  // or modify the UI to use the name from the report if officer is missing?
  // Maintenance task uses `assigned_to` which references `auth.users`. 
  // Since we can't easily create auth users via anon key, we'll fetch existing users and assign them.
  // Wait, we can fetch users via an edge function, or we can just use any existing users.
  const { data: users } = await supabase.from('user_roles').select('user_id').eq('role', 'field_officer').limit(3);
  
  let user1, user2, user3;
  if (users && users.length > 0) {
    user1 = users[0].user_id;
    user2 = users[1] ? users[1].user_id : user1;
    user3 = users[2] ? users[2].user_id : user1;
  }

  // 3. Insert 3 Damage Reports
  const reports = [
    {
      ticket_code: 'INF-20241003-8821', 
      reporter_name: 'Budi Santoso', 
      damage_type_id: damageTypeId,
      urgency_level: 'tinggi',
      description: 'Struktur Jembatan Merah',
      location: 'POINT(107.6  -6.9)',
      latitude: -6.9,
      longitude: 107.6,
      status: 'terverifikasi'
    }
  ];


  const insertedReports = [];
  for (const r of reports) {
    const { data, error } = await supabase.from('damage_reports').insert(r).select().single();
    if (error) console.error("Error inserting report:", error);
    if (data) insertedReports.push(data);
  }

  console.log("Reports inserted:", insertedReports.length);

  if (insertedReports.length === 3) {
    // 4. Insert 3 Maintenance Tasks
    // task 1: Oct 3, 2024 08:00
    // task 2: Oct 7, 2024 11:30
    // task 3: Oct 15, 2024 14:00

    // Set dates in current month so it actually shows up as "Upcoming" instead of October 2024!
    // If I put it in Oct 2024, the "upcoming tasks" filter will filter it out!
    // The filter in the code is: new Date(t.scheduled_date) >= new Date(now.setHours(0,0,0,0))
    // Let's use May 2026 dates (e.g. May 3, May 7, May 15) so it matches the dates but in the current month!
    
    // Wait, the user wants it to look exactly like the mockup, including the calendar showing October 2024!
    // If we want it to show in October 2024, we MUST modify the `upcomingTasks` filter in the frontend to not use `new Date()` but `currentDate` of the calendar!
    
    const tasks = [
      {
        report_id: insertedReports[0].id,
        scheduled_date: '2024-10-03T08:00:00+07:00',
        estimated_cost: 5000000,
        status: 'assigned',
        assigned_to: user1
      },
      {
        report_id: insertedReports[1].id,
        scheduled_date: '2024-10-07T11:30:00+07:00',
        estimated_cost: 2000000,
        status: 'assigned',
        assigned_to: user2
      },
      {
        report_id: insertedReports[2].id,
        scheduled_date: '2024-10-15T14:00:00+07:00',
        estimated_cost: 1000000,
        status: 'assigned',
        assigned_to: user3
      }
    ];

    const { error: tErr } = await supabase.from('maintenance_tasks').insert(tasks);
    if (tErr) console.error("Error inserting tasks:", tErr);
    else console.log("Tasks inserted successfully!");
  }
}

seedMockupData();
