import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fgcunyebdabjvzgiaidc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const API_BASE_URL = 'http://localhost:5000';

async function testApi() {
  console.log('🔑 Logging in as Admin...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@infratrack.id',
    password: 'Admin@1234'
  });

  if (authError) {
    console.error('❌ Login failed:', authError.message);
    return;
  }

  const token = authData.session.access_token;
  console.log('✅ Logged in successfully. Token:', token.substring(0, 15) + '...');

  // 1. Test GET /api/notifications
  console.log('\n📡 Testing GET /api/notifications...');
  const getRes = await fetch(`${API_BASE_URL}/api/notifications`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Status:', getRes.status);
  const getData = await getRes.json();
  console.log('Data (first 2 items):', JSON.stringify(getData.notifications?.slice(0, 2), null, 2));

  // 2. Test GET /api/notifications/unread-count
  console.log('\n📡 Testing GET /api/notifications/unread-count...');
  const countRes = await fetch(`${API_BASE_URL}/api/notifications/unread-count`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Status:', countRes.status);
  const countData = await countRes.json();
  console.log('Data:', countData);

  // 3. Test PATCH /api/notifications/read-all
  console.log('\n📡 Testing PATCH /api/notifications/read-all...');
  const readAllRes = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Status:', readAllRes.status);
  const readAllData = await readAllRes.json();
  console.log('Data:', readAllData);

  // 4. Test PATCH /api/notifications/:id/read
  if (getData.notifications && getData.notifications.length > 0) {
    const targetId = getData.notifications[0].id;
    console.log(`\n📡 Testing PATCH /api/notifications/${targetId}/read...`);
    const readItemRes = await fetch(`${API_BASE_URL}/api/notifications/${targetId}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Status:', readItemRes.status);
    const readItemData = await readItemRes.json();
    console.log('Data:', readItemData);
  }
}

testApi();
