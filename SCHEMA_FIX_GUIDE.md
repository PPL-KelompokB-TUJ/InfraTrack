# InfraTrack - Schema Fix Summary

## 🔴 Problem
```
Could not find the 'category' column of 'infrastructure_assets' in the schema cache
```

## 🔍 Root Cause
The `category` column is **missing** from your `infrastructure_assets` table in Supabase.

### Current Table Structure
```
infrastructure_assets
├── id
├── name
├── location
├── condition
├── year_built
├── photo_url
├── created_at
├── updated_at
└── infrastructure_category_id  ❌ (Wrong - should be 'category' text column)
```

## ✅ Solution

You have two options to fix this:

### Option 1: Manual Fix via Supabase Dashboard (Recommended)

1. **Go to SQL Editor**: https://app.supabase.com/project/fgcunyebdabjvzgiaidc/sql

2. **Copy and paste this SQL**:
   ```sql
   ALTER TABLE public.infrastructure_assets
   ADD COLUMN IF NOT EXISTS category text not null default 'Jalan';
   ```

3. **Click "Run"** or press `Ctrl+Enter`

4. **Verify** it succeeded - you should see "Query executed successfully"

### Option 2: Automated Fix via Admin Key

If you have your Supabase admin key (service role secret), run:

```bash
SUPABASE_ADMIN_KEY=your_key_here node apply-category-migration.js
```

**Where to find the admin key:**
1. Go to: https://app.supabase.com/project/fgcunyebdabjvzgiaidc/settings/api
2. Look for **"service_role"** secret key (⚠️ Not the public key)
3. Copy it and use in the command above

## 📋 Migration Files Created

The following helper files have been created:

- `supabase/ADD_CATEGORY_COLUMN.sql` - The migration SQL
- `apply-category-migration.js` - Automated migration script
- `verify-category-column.js` - Verification script
- `show-migration.js` - Display migration details

## ✨ After Applying the Fix

Once the SQL is executed:

1. **Refresh** your browser page
2. **Restart** your development server (if running)
3. The error will be resolved ✅

## 🔧 Verification

After applying the migration, run:

```bash
node verify-category-column.js
```

This will confirm the column is working correctly.

---

**Created**: 2026-04-17
**Status**: Ready to apply fix
**Recommended Action**: Use Option 1 (Manual SQL in Dashboard)
