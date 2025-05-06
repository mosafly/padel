/*
  # Add Profiles INSERT Policy
  
  1. Changes
     - Add INSERT policy for the profiles table to allow users to create their own profile during sign-up
     
  2. Security
     - The policy ensures users can only create their own profile (where auth.uid() = id)
     - Users can only set their role to 'client' during registration
*/

-- Add INSERT policy for profiles table
CREATE POLICY "users_insert_own_profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id AND 
  role = 'client'
);