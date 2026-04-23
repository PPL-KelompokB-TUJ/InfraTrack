#!/usr/bin/env node
/**
 * Setup Supabase Auth accounts for field officers
 * Creates auth users with proper role metadata for field officer login
 * 
 * Usage: node setup-field-officer-auth.js
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env
dotenv.config();

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fgcunyebdabjvzgiaidc.supabase.co';
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ADMIN_KEY;

if (!supabaseAdminKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ADMIN_KEY environment variable is not set');
  console.error('   Please set it before running this script');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAdminKey);

// Field officers to setup
const fieldOfficers = [
  {
    name: 'Ahmad Sutrisno',
    email: 'ahmad.sutrisno@example.com',
    password: 'Ahmad123!@#',
  },
  {
    name: 'Budi Santoso',
    email: 'budi.santoso@example.com',
    password: 'Budi123!@#',
  },
  {
    name: 'Citra Dewi',
    email: 'citra.dewi@example.com',
    password: 'Citra123!@#',
  },
];

async function setupFieldOfficerAuth() {
  console.log('🔧 Setting up Supabase Auth for Field Officers...\n');

  const results = [];
  const errors = [];

  for (const officer of fieldOfficers) {
    try {
      console.log(`⏳ Processing: ${officer.name} (${officer.email})`);

      // Step 1: Create Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: officer.email,
        password: officer.password,
        email_confirm: true,
        user_metadata: {
          role: 'field_officer',
          name: officer.name,
        },
        app_metadata: {
          role: 'field_officer',
        },
      });

      if (authError) {
        // Check if user already exists
        if (authError.message?.includes('User already registered')) {
          console.log(`   ⚠️  User already exists, updating metadata...`);
          
          // Try to update the user
          const { data: userData, error: getUserError } = await supabase.auth.admin.listUsers();
          if (getUserError) throw getUserError;

          const existingUser = userData.users.find(u => u.email === officer.email);
          if (existingUser) {
            const { error: updateError } = await supabase.auth.admin.updateUserById(
              existingUser.id,
              {
                app_metadata: { role: 'field_officer' },
                user_metadata: { role: 'field_officer', name: officer.name },
              }
            );

            if (updateError) throw updateError;
            console.log(`   ✅ Updated metadata for existing user`);
            results.push({
              name: officer.name,
              email: officer.email,
              password: officer.password,
              status: 'updated',
            });
          }
        } else {
          throw authError;
        }
      } else {
        console.log(`   ✅ Created Supabase Auth user`);
        results.push({
          name: officer.name,
          email: officer.email,
          password: officer.password,
          status: 'created',
          uid: authData.user.id,
        });
      }

      // Step 2: Verify user exists in public.users
      const { data: publicUsers, error: publicError } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('email', officer.email)
        .single();

      if (publicError && publicError.code !== 'PGRST116') {
        console.log(`   ⚠️  Not in public.users table (will create)`);
      } else if (publicUsers) {
        console.log(`   ✅ Found in public.users table`);
      }

      // Step 3: Ensure user exists in public.users
      if (!publicUsers) {
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            name: officer.name,
            email: officer.email,
            role: 'field_officer',
            is_active: true,
          });

        if (insertError && !insertError.message?.includes('duplicate')) {
          console.log(`   ⚠️  Could not insert to public.users: ${insertError.message}`);
        } else {
          console.log(`   ✅ Added to public.users table`);
        }
      }

      console.log('');
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
      errors.push({
        name: officer.name,
        email: officer.email,
        error: error.message,
      });
    }
  }

  // Summary
  console.log('════════════════════════════════════════════════════════');
  console.log('📊 SETUP COMPLETE\n');

  if (results.length > 0) {
    console.log('✅ Successfully configured:');
    results.forEach((r) => {
      console.log(`   • ${r.name} (${r.email})`);
      console.log(`     Status: ${r.status}`);
      console.log(`     Password: ${r.password}`);
      if (r.uid) console.log(`     UID: ${r.uid}`);
    });
  }

  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach((e) => {
      console.log(`   • ${e.name} (${e.email}): ${e.error}`);
    });
  }

  console.log('\n════════════════════════════════════════════════════════');
  console.log('🧪 TEST LOGIN:\n');
  console.log('1. Open InfraTrack application');
  console.log('2. Click "🚗 Petugas" in login modal');
  console.log('3. Use these credentials:\n');

  fieldOfficers.forEach((officer) => {
    console.log(`   Email:    ${officer.email}`);
    console.log(`   Password: ${officer.password}`);
    console.log('');
  });

  console.log('════════════════════════════════════════════════════════\n');

  // Save credentials to file for reference
  const credentialsFile = path.join(__dirname, 'FIELD_OFFICER_CREDENTIALS.md');
  const credentialsContent = `# Field Officer Test Credentials

**Generated on**: ${new Date().toISOString()}

## Login Test Accounts

${fieldOfficers
  .map(
    (officer) => `
### ${officer.name}
- **Email**: ${officer.email}
- **Password**: ${officer.password}
- **Role**: field_officer

`
  )
  .join('')}

## How to Login

1. Open the InfraTrack application
2. Click on "🚗 Petugas" button in the login modal
3. Enter email and password from above
4. Click "Masuk"

## Verification

After successful login, you should see:
- User name displayed in the header
- "Petugas" role indicator
- Petugas-specific menu items and features

---

**Note**: These credentials are for development/testing only.
`;

  fs.writeFileSync(credentialsFile, credentialsContent, 'utf-8');
  console.log(`📝 Credentials saved to: FIELD_OFFICER_CREDENTIALS.md`);
}

setupFieldOfficerAuth().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
