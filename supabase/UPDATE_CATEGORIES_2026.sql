-- Update Infrastructure Categories: Remove Fasum/Ayam Goreng, Add new categories

-- Delete old categories that are not in the new list
DELETE FROM public.infrastructure_categories 
WHERE name IN ('Fasum', 'Ayam goreng', 'Ayam Goreng');

-- Insert new categories if they don't exist
INSERT INTO public.infrastructure_categories (name, is_default, is_active)
VALUES
  ('Jalan', false, true),
  ('Jembatan', false, true),
  ('Saluran Drainase', false, true),
  ('Air Bersih', false, true),
  ('Listrik', false, true)
ON CONFLICT (name) DO UPDATE
SET is_active = true;

-- Set Jalan as default if no default exists
UPDATE public.infrastructure_categories
SET is_default = true
WHERE name = 'Jalan'
  AND NOT EXISTS (SELECT 1 FROM public.infrastructure_categories WHERE is_default = true);

-- Insert 'Lainnya' damage type for each category if not exists
INSERT INTO public.damage_types (name, infrastructure_category_id, is_default, is_active)
SELECT 'Lainnya', id, false, true
FROM public.infrastructure_categories
WHERE name IN ('Jalan', 'Jembatan', 'Saluran Drainase', 'Air Bersih', 'Listrik')
ON CONFLICT (infrastructure_category_id, name) DO UPDATE
SET is_active = true;

-- Display current categories for verification
SELECT id, name, is_default, is_active FROM public.infrastructure_categories ORDER BY is_default DESC, name ASC;
