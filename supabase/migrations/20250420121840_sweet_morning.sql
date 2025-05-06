/*
  # Fix profile policies for all users

  This migration fixes issues with profiles table policies
  to ensure all authenticated users can properly access profiles.
*/

-- Drop existing policies to clean up
DROP POLICY IF EXISTS "admin_read_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_read_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON public.profiles;

-- Create cleaner, more effective policies
-- Allow users to read their own profile (crucial for authentication)
CREATE POLICY "users_read_own_profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Allow admins to read all profiles
CREATE POLICY "admin_read_all_profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles AS p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Allow users to insert their own profile with client role
CREATE POLICY "users_insert_own_profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id AND 
  role = 'client'
);

-- Add a trigger to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 
    CASE 
      WHEN NOT EXISTS (SELECT 1 FROM public.profiles) THEN 'admin'
      ELSE 'client'
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger exists (create if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END
$$;

-- Create a procedure to manually fix profiles if needed
CREATE OR REPLACE PROCEDURE public.fix_missing_profiles()
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert profiles for any users that don't have them
  INSERT INTO public.profiles (id, role)
  SELECT id, 'client' FROM auth.users
  WHERE id NOT IN (SELECT id FROM public.profiles)
  ON CONFLICT (id) DO NOTHING;
  
  -- Set the first user as admin if no admin exists
  UPDATE public.profiles
  SET role = 'admin'
  WHERE id = (
    SELECT id FROM auth.users 
    ORDER BY created_at 
    LIMIT 1
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE role = 'admin'
  );
END;
$$;

-- Execute the fix procedure
CALL public.fix_missing_profiles();