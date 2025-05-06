/*
  # Fix courts policies

  This migration updates the courts table policies to ensure they can be accessed properly
  by all authenticated users without permissions issues.
*/

-- First, let's ensure we can check if any policy needs to be re-created
DO $$
DECLARE
  policy_exists BOOLEAN;
BEGIN
  -- Check if the courts_read_all policy exists
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'courts'
    AND policyname = 'courts_read_all'
  ) INTO policy_exists;
  
  -- Drop and recreate the read policy if it exists
  IF policy_exists THEN
    DROP POLICY IF EXISTS "courts_read_all" ON public.courts;
    
    RAISE NOTICE 'Recreating courts read policy';
  END IF;
END
$$;

-- Create (or recreate) the read policy for courts to ensure all users can read them
CREATE POLICY "courts_read_all"
ON public.courts
FOR SELECT
TO authenticated
USING (true);

-- Let's also make sure courts exist in the database
DO $$
BEGIN
  -- Insert courts only if there are none
  IF NOT EXISTS (SELECT 1 FROM public.courts LIMIT 1) THEN
    INSERT INTO courts (name, description, price_per_hour, image_url, status)
    VALUES 
      ('Court 1', 'Professional court with top-quality playing surface and lighting.', 30.00, 'https://images.pexels.com/photos/2277807/pexels-photo-2277807.jpeg', 'available'),
      ('Court 2', 'Indoor court with climate control, perfect for all-weather play.', 35.00, 'https://images.pexels.com/photos/1103829/pexels-photo-1103829.jpeg', 'available'),
      ('Court 3', 'Beginners court with instructor support available.', 25.00, 'https://images.pexels.com/photos/8224681/pexels-photo-8224681.jpeg', 'available'),
      ('Court 4', 'Competition grade court with seating for spectators.', 40.00, 'https://images.pexels.com/photos/2403406/pexels-photo-2403406.jpeg', 'maintenance');
      
    RAISE NOTICE 'Sample courts have been added';
  END IF;
END
$$;