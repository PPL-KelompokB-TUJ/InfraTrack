-- =========================================================
-- CREATE EXPORTS STORAGE BUCKET & RLS POLICIES
-- =========================================================

-- 1. Insert bucket 'exports' if it does not exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exports', 
  'exports', 
  true, 
  52428800, -- 50 MB
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies to prevent duplicates
DROP POLICY IF EXISTS "Allow authenticated upload to exports" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read from exports" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete from exports" ON storage.objects;

-- 3. Create RLS policies for storage.objects on the exports bucket

-- Allow authenticated users (Admins) to upload files
CREATE POLICY "Allow authenticated upload to exports"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'exports');

-- Allow anyone (public) to view/download reports
CREATE POLICY "Allow public read from exports"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'exports');

-- Allow authenticated users (Admins) to delete reports
CREATE POLICY "Allow authenticated delete from exports"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'exports');
