/*
  # Fix profile policies for admin access

  This migration fixes the policies for admin users to properly access
  their own profiles and other profiles in the system.
*/

-- Drop and recreate admin read policies with correct conditions
DROP POLICY IF EXISTS "admin_read_profiles" ON public.profiles;

-- Create proper admin read policy that allows admins to read all profiles
CREATE POLICY "admin_read_profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create a special debug admin user if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = 'admin@example.com'
  ) THEN
    -- Log a message since we can't create auth users directly in SQL
    RAISE NOTICE 'No admin user exists. You should create one manually.';
  END IF;
END
$$;

-- Ensure all users can read their own profile regardless of role
-- This is vital for the login flow to work properly
DROP POLICY IF EXISTS "users_read_own_profile" ON public.profiles;

CREATE POLICY "users_read_own_profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Logging to help with debugging
DO $$
BEGIN
  RAISE NOTICE 'Migration complete: Policies for profiles table have been fixed.';
END
$$;