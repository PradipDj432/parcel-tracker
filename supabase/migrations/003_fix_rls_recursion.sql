-- ============================================
-- FIX: Infinite recursion in admin RLS policies
-- The old "Admins can read all profiles" policy queried
-- public.profiles to check admin role, which triggered
-- the same RLS policy again — infinite loop.
-- Fix: use a SECURITY DEFINER function that bypasses RLS.
-- ============================================

-- Helper function to check admin status (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Fix profiles admin policy
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- Fix trackings admin policy
DROP POLICY IF EXISTS "Admins can read all trackings" ON public.trackings;
CREATE POLICY "Admins can read all trackings"
  ON public.trackings FOR SELECT
  USING (public.is_admin());

-- Fix contact_submissions admin policy
DROP POLICY IF EXISTS "Admins can read all contact submissions" ON public.contact_submissions;
CREATE POLICY "Admins can read all contact submissions"
  ON public.contact_submissions FOR SELECT
  USING (public.is_admin());
