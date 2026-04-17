-- Migration: Add category column to infrastructure_assets
-- This fixes the "Could not find the 'category' column" error

ALTER TABLE public.infrastructure_assets
ADD COLUMN IF NOT EXISTS category text not null default 'Jalan';

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'infrastructure_assets'
ORDER BY ordinal_position;
