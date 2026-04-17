-- ============================================
-- INFRATRACK - COMPLETE DATABASE SETUP
-- COPY ALL & PASTE ke Supabase SQL Editor
-- ============================================

-- 1. Create users table (jika belum ada)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password text,
  role text NOT NULL CHECK (role IN ('admin', 'field_officer', 'citizen')),
  is_active boolean NOT NULL DEFAULT true,
  profile_photo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create user_profiles table (jika belum ada)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  specialization text,
  work_area text,
  phone text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Create maintenance_tasks table (jika belum ada)
CREATE TABLE IF NOT EXISTS public.maintenance_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES public.damage_reports(id) ON DELETE SET NULL,
  asset_id uuid REFERENCES public.infrastructure_assets(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  scheduled_date timestamp NOT NULL,
  estimated_cost decimal(12, 2),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
  instructions text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Create notifications table (jika belum ada)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  related_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Create triggers untuk updated_at
CREATE OR REPLACE FUNCTION public.set_users_updated_at_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.set_users_updated_at_timestamp();

-- 6. Create indexes
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);
CREATE INDEX IF NOT EXISTS users_role_idx ON public.users(role);
CREATE INDEX IF NOT EXISTS users_is_active_idx ON public.users(is_active);
CREATE INDEX IF NOT EXISTS user_profiles_user_id_idx ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS maintenance_tasks_assigned_to_idx ON public.maintenance_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS maintenance_tasks_status_idx ON public.maintenance_tasks(status);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);

-- 7. Insert test users (jika belum ada)
INSERT INTO public.users (name, email, role, is_active)
VALUES
  ('Ahmad Sutrisno', 'ahmad@example.com', 'field_officer', true),
  ('Budi Santoso', 'budi@example.com', 'field_officer', true),
  ('Citra Dewi', 'citra@example.com', 'field_officer', true),
  ('Dewi Lestari', 'dewi@example.com', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- 8. Insert test user profiles
INSERT INTO public.user_profiles (user_id, specialization, work_area, phone)
SELECT id, 'Jalan & Drainase', 'Jakarta Selatan', '081234567890'
FROM public.users
WHERE email = 'ahmad@example.com'
  AND NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = public.users.id);

INSERT INTO public.user_profiles (user_id, specialization, work_area, phone)
SELECT id, 'Jembatan & Bangunan', 'Jakarta Pusat', '082345678901'
FROM public.users
WHERE email = 'budi@example.com'
  AND NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = public.users.id);

INSERT INTO public.user_profiles (user_id, specialization, work_area, phone)
SELECT id, 'Fasilitas Umum', 'Jakarta Utara', '083456789012'
FROM public.users
WHERE email = 'citra@example.com'
  AND NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = public.users.id);

-- ============================================
-- DONE! Tables created with test data
-- ============================================
