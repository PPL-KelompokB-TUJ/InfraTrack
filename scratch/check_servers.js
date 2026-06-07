async function checkServers() {
  console.log('--- Checking frontend Vite dev server (http://localhost:5173) ---');
  try {
    const res = await fetch('http://localhost:5173');
    console.log('Vite dev server is responding. Status:', res.status);
  } catch (e) {
    console.log('Vite dev server is NOT responding:', e.message);
  }

  console.log('\n--- Checking backend server (http://localhost:5000) ---');
  try {
    const res = await fetch('http://localhost:5000/api/health');
    const data = await res.json();
    console.log('Backend server is responding. Status:', res.status, 'Data:', data);
  } catch (e) {
    console.log('Backend server is NOT responding:', e.message);
  }
}

checkServers();
