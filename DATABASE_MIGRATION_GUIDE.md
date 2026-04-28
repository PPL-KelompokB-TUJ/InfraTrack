# Database Migration Guide - Post Merge (April 23, 2026)

## 🔴 CRITICAL: Foreign Key Fix Required First

After merging Pras-niBos into main, you MUST apply database migrations to fix critical issues.

---

## Step-by-Step Migration Process

### Step 1: Login to Supabase

1. Go to https://supabase.com
2. Log in to your project
3. Navigate to **SQL Editor**

---

### Step 2: Apply FK Fix (MOST CRITICAL)

**What it does**: Fixes duplicate foreign keys on maintenance_tasks table that cause PostgREST relationship errors

**File**: `supabase/fix_duplicate_maintenance_task_fks.sql`

**Steps**:
1. Copy the content from the file
2. Paste into Supabase SQL Editor
3. Click "Run"
4. Verify: Should show foreign key constraints without duplicates

**Expected Output**:
```
conname                          | table_name           | referenced_table
---------------------------------|----------------------|------------------
maintenance_tasks_asset_id_fkey  | public.maintenance_tasks | public.infrastructure_assets
maintenance_tasks_report_id_fkey | public.maintenance_tasks | public.damage_reports
```

---

### Step 3: Update Master Data Categories (Optional but Recommended)

**What it does**: Adds new infrastructure categories

**File**: `supabase/UPDATE_CATEGORIES_2026.sql`

**New Categories Added**:
- Saluran Drainase (Drainage Channel)
- Air Bersih (Clean Water)
- Listrik (Electricity)

**Steps**:
1. Copy from file
2. Paste into Supabase SQL Editor
3. Click "Run"

---

### Step 4: Field Officer Setup (If Using Field Officer Features)

If your application uses field officer management:

#### 4.1 Fix Users Table RLS
**File**: `supabase/FIX_USERS_TABLE_RLS.sql`
```
Execute in Supabase SQL Editor
```

#### 4.2 Create Officer Passwords Table
**File**: `supabase/CREATE_OFFICER_PASSWORDS.sql`
```
Execute in Supabase SQL Editor
```

#### 4.3 Ensure Field Officers View
**File**: `supabase/ENSURE_FIELD_OFFICERS_VIEW.sql`
```
Execute in Supabase SQL Editor
```

#### 4.4 Setup Task Progress Tracking
**File**: `supabase/setup-task-progress-tracking.sql`
```
Execute in Supabase SQL Editor
```

---

### Step 5: Verification System (If Using)

**What it does**: Adds damage report verification/validation system

**File**: `supabase/ADD_VERIFICATION_SYSTEM.sql`

**Steps**:
1. Copy from file
2. Paste into Supabase SQL Editor
3. Click "Run"

---

## 🔍 Verification Queries

### Verify FK Fix
```sql
-- Check that maintenance_tasks has correct FKs
SELECT
  conname,
  conrelid::regclass as table_name,
  confrelid::regclass as referenced_table,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.maintenance_tasks'::regclass
  AND contype = 'f'
ORDER BY conname;
```

**Should return exactly 2 rows** (no duplicates):
1. `maintenance_tasks_asset_id_fkey`
2. `maintenance_tasks_report_id_fkey`

### Verify Master Data
```sql
-- Check updated categories
SELECT id, name, is_active 
FROM public.infrastructure_categories 
ORDER BY name;
```

### Test Maintenance Tasks Query
```sql
-- This should now work without relationship ambiguity
SELECT 
  mt.id,
  mt.status,
  dr.ticket_code,
  ia.name as asset_name
FROM public.maintenance_tasks mt
LEFT JOIN public.damage_reports dr ON dr.id = mt.report_id
LEFT JOIN public.infrastructure_assets ia ON ia.id = mt.asset_id
LIMIT 10;
```

---

## ⚠️ Troubleshooting

### Error: "Relationship ambiguity"
- **Solution**: Run `fix_duplicate_maintenance_task_fks.sql` first
- This indicates step 2 was not completed

### Error: "Column does not exist"
- **Solution**: Check that all required tables exist
- Run `SETUP_MISSING_TABLES.sql` if needed

### Field Officer Features Not Working
- **Solution**: Complete steps 4.1-4.4
- Check that `field_officers_view` exists

### Categories Not Updated
- **Solution**: Run `UPDATE_CATEGORIES_2026.sql`
- Verify with the query above

---

## 📋 Application Testing

After migrations, test these features in your app:

1. **Maintenance Tasks**
   - Can you view maintenance tasks?
   - Do related data (reports, assets) load?
   - No console errors about relationships?

2. **Damage Reports**
   - Can you view damage reports?
   - Can you create new reports?

3. **Dashboard** (if enabled)
   - Does admin dashboard load?
   - Are statistics calculated correctly?

4. **Field Officer Features** (if enabled)
   - Can field officers log in?
   - Can they view assigned tasks?
   - Can they submit task updates?

---

## 🔄 Rollback (If Needed)

If something goes wrong:

1. Git has backup branch: `git checkout backup`
2. You can inspect the previous main version
3. Supabase: Check **Database** → **Backups** for automatic backups

---

## 📊 Migration Order Summary

| Step | File | Status | Notes |
|------|------|--------|-------|
| 1 | fix_duplicate_maintenance_task_fks.sql | 🔴 CRITICAL | Run first! |
| 2 | UPDATE_CATEGORIES_2026.sql | 🟡 Recommended | New categories |
| 3-6 | Field Officer Setup (4 files) | 🟢 Optional | Only if using field officers |
| 7 | ADD_VERIFICATION_SYSTEM.sql | 🟢 Optional | Damage report verification |

---

## 💡 Key Points

✅ Foreign key fix resolves PostgREST relationship ambiguity  
✅ Master data update adds 3 new categories  
✅ Field officer features are optional  
✅ Backup branch preserved for recovery  
✅ All migration files are in `supabase/` folder  

---

**Important**: Start with Step 2 (FK fix) - it's the most critical!

**Need Help?** Check SETUP.md for general database setup instructions.
