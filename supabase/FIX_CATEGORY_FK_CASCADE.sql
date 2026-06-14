-- Fix foreign key constraints to allow CASCADE deletion
-- This allows deleting infrastructure_categories even if referenced by assets/damage_types
-- And allows deleting damage_types even if referenced by damage_reports

-- 1. Drop the old restrict constraints
ALTER TABLE public.infrastructure_assets
DROP CONSTRAINT IF EXISTS infrastructure_assets_category_fk;

ALTER TABLE public.damage_types
DROP CONSTRAINT IF EXISTS damage_types_infrastructure_category_id_fkey;

ALTER TABLE public.damage_reports
DROP CONSTRAINT IF EXISTS damage_reports_damage_type_fk;

-- 2. Recreate with CASCADE delete
ALTER TABLE public.infrastructure_assets
ADD CONSTRAINT infrastructure_assets_category_fk
FOREIGN KEY (infrastructure_category_id)
REFERENCES public.infrastructure_categories(id)
ON UPDATE CASCADE
ON DELETE CASCADE;

ALTER TABLE public.damage_types
ADD CONSTRAINT damage_types_infrastructure_category_id_fkey
FOREIGN KEY (infrastructure_category_id)
REFERENCES public.infrastructure_categories(id)
ON UPDATE CASCADE
ON DELETE CASCADE;

ALTER TABLE public.damage_reports
ADD CONSTRAINT damage_reports_damage_type_fk
FOREIGN KEY (damage_type_id)
REFERENCES public.damage_types(id)
ON UPDATE CASCADE
ON DELETE CASCADE;
