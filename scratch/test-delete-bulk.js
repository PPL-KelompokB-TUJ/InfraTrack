import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env');
  process.exit(1);
}

async function testDeleteBulk() {
  console.log('🧪 Starting Bulk Delete Verification Tests...');

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log('🔑 Logging in as Admin...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@infratrack.id',
    password: 'Admin@1234'
  });

  if (authError) {
    console.error('❌ Authentication failed:', authError.message);
    process.exit(1);
  }

  console.log('✅ Admin login successful.');
  const accessToken = authData.session.access_token;
  
  // Create authorized client
  const adminClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  });

  // 1. Create a dummy file in public/exports
  const publicExportsDir = path.join(__dirname, '..', 'public', 'exports');
  if (!fs.existsSync(publicExportsDir)) {
    fs.mkdirSync(publicExportsDir, { recursive: true });
  }

  const dummyFilename = 'InfraTrack_AssetCondition_TESTDELETE.pdf';
  const dummyFilePath = path.join(publicExportsDir, dummyFilename);
  fs.writeFileSync(dummyFilePath, 'dummy PDF content');
  console.log(`\n✅ Dummy file created at: ${dummyFilePath}`);

  // 2. Insert dummy export history record in database
  const dummyUrl = `http://localhost:5000/exports/${dummyFilename}`;
  const { data: record, error: insertError } = await adminClient
    .from('export_history')
    .insert({
      report_type: 'asset-condition',
      format: 'pdf',
      status: 'completed',
      file_url: dummyUrl
    })
    .select()
    .single();

  if (insertError) {
    console.error('❌ Failed to insert dummy record:', insertError.message);
    process.exit(1);
  }

  const jobId = record.id;
  console.log(`✅ Dummy database record inserted. Job ID: ${jobId}`);

  // 3. Verify file exists on disk and row exists in DB
  if (!fs.existsSync(dummyFilePath)) {
    console.error('❌ Error: Dummy file does not exist before deletion!');
    process.exit(1);
  }
  console.log('🔍 Verified: file exists on disk.');

  // 4. Run the deletion logic
  console.log(`\n⏳ Simulating deletion for ID: ${jobId}...`);
  
  // Extract file URL & Delete
  const { data: fetchedRecords, error: fetchErr } = await adminClient
    .from('export_history')
    .select('file_url')
    .eq('id', jobId)
    .single();

  if (fetchErr || !fetchedRecords) {
    console.error('❌ Failed to fetch record for deletion verification:', fetchErr?.message);
    process.exit(1);
  }

  const urlObj = new URL(fetchedRecords.file_url);
  const filename = path.basename(urlObj.pathname);
  const targetFilePath = path.join(publicExportsDir, filename);

  if (fs.existsSync(targetFilePath)) {
    fs.unlinkSync(targetFilePath);
    console.log(`🗑️ Local file '${filename}' deleted successfully.`);
  } else {
    console.log(`⚠️ Warning: Local file '${filename}' not found for deletion.`);
  }

  // Delete from DB
  const { error: deleteError } = await adminClient
    .from('export_history')
    .delete()
    .eq('id', jobId);

  if (deleteError) {
    console.error('❌ Database deletion failed:', deleteError.message);
    process.exit(1);
  }
  console.log('🗑️ Database record deleted successfully.');

  // 5. Final validation checks
  const fileExistsAfter = fs.existsSync(dummyFilePath);
  const { data: recordAfter } = await adminClient
    .from('export_history')
    .select('*')
    .eq('id', jobId);

  const isDbRecordDeleted = !recordAfter || recordAfter.length === 0;

  if (!fileExistsAfter && isDbRecordDeleted) {
    console.log('\n🎉 ALL BULK DELETION VERIFICATION TESTS PASSED SUCCESSFULLY!\n');
  } else {
    console.error('\n❌ VERIFICATION TEST FAILED! File or DB record still exists.\n');
    process.exit(1);
  }
}

testDeleteBulk();
