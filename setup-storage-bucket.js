#!/usr/bin/env node
/**
 * Setup storage bucket for maintenance task progress photos
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseAdminKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAdminKey);

async function setupStorageBucket() {
  console.log('🪣 Setting up maintenance progress storage bucket...\n');

  try {
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some(b => b.name === 'maintenance-progress');

    if (exists) {
      console.log('✅ Bucket "maintenance-progress" already exists\n');
    } else {
      console.log('➕ Creating bucket "maintenance-progress"...');
      
      const { data, error } = await supabase.storage.createBucket(
        'maintenance-progress',
        {
          public: true,
          allowedMimeTypes: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
          ],
          fileSizeLimit: 10485760, // 10 MB
        }
      );

      if (error) {
        if (error.message?.includes('already exists')) {
          console.log('✅ Bucket already exists');
        } else {
          throw error;
        }
      } else {
        console.log('✅ Bucket created successfully\n');
      }
    }

    console.log('════════════════════════════════════════════════════════\n');
    console.log('📋 ADDITIONAL SETUP REQUIRED:\n');
    console.log('1. Run SQL setup script in Supabase SQL Editor:');
    console.log('   File: supabase/setup-task-progress-tracking.sql');
    console.log('   OR run: node setup-progress-tracking.js\n');
    console.log('2. This creates:');
    console.log('   ✅ public.task_progress table');
    console.log('   ✅ RLS policies');
    console.log('   ✅ Function: update_maintenance_task_status()\n');
    console.log('════════════════════════════════════════════════════════\n');

    console.log('✅ Storage bucket ready for progress photos!\n');
    console.log('Max file size: 10 MB');
    console.log('Allowed types: JPEG, PNG, GIF, WebP\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setupStorageBucket();
