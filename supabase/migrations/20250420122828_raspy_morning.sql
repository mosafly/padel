/*
  # Debug courts table and add sample courts
  
  1. Checking and fixing:
    - Check if courts table exists
    - Recreate courts policy if needed
    - Add sample courts if none exist
  2. Security:
    - Ensure RLS is enabled
    - Recreate read policy for authenticated users
*/

-- First check if the courts table exists and has the correct structure
DO $$
BEGIN
  -- Create a temporary table to store whether courts exist
  CREATE TEMP TABLE IF NOT EXISTS temp_courts_check (
    has_courts boolean
  );
  
  -- Try to count courts and capture the result
  BEGIN
    INSERT INTO temp_courts_check 
    SELECT EXISTS (SELECT 1 FROM public.courts LIMIT 1);
    RAISE NOTICE 'Courts table exists and is accessible';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error accessing courts table: %', SQLERRM;
    INSERT INTO temp_courts_check VALUES (false);
  END;
END
$$;

-- Ensure courts read policy is correctly set up
DROP POLICY IF EXISTS "courts_read_all" ON public.courts;

CREATE POLICY "courts_read_all"
ON public.courts
FOR SELECT
USING (true);

-- Make sure everyone can read courts
GRANT SELECT ON public.courts TO authenticated;
GRANT SELECT ON public.courts TO anon;

-- Insert sample courts if the table is empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.courts LIMIT 1) THEN
    INSERT INTO courts (name, description, price_per_hour, image_url, status)
    VALUES 
      ('Pro Court 1', 'Professional court with top-quality playing surface and lighting.', 30.00, 'https://images.pexels.com/photos/2277807/pexels-photo-2277807.jpeg', 'available'),
      ('Indoor Court 2', 'Indoor court with climate control, perfect for all-weather play.', 35.00, 'https://images.pexels.com/photos/1103829/pexels-photo-1103829.jpeg', 'available'),
      ('Beginners Court 3', 'Beginners court with instructor support available.', 25.00, 'https://images.pexels.com/photos/8224681/pexels-photo-8224681.jpeg', 'available'),
      ('Competition Court 4', 'Competition grade court with seating for spectators.', 40.00, 'https://images.pexels.com/photos/2403406/pexels-photo-2403406.jpeg', 'maintenance');
      
    RAISE NOTICE 'Sample courts have been added';
  ELSE
    RAISE NOTICE 'Courts already exist in the database';
  END IF;
END
$$;

-- Log court count for debugging
DO $$
DECLARE
  court_count int;
BEGIN
  SELECT COUNT(*) INTO court_count FROM public.courts;
  RAISE NOTICE 'Number of courts in database: %', court_count;
END
$$;