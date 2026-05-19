
-- Create storage buckets for the application
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('registrations', 'registrations', true),
  ('registration-data', 'registration-data', true),
  ('event-images', 'event-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Set up storage policies for all storage buckets (public access for simplicity)
DO $$
BEGIN
  -- Clean up any existing policies
  DROP POLICY IF EXISTS "Public Access for All Buckets" ON storage.objects;
  DROP POLICY IF EXISTS "Public Upload Access for All Buckets" ON storage.objects;
  DROP POLICY IF EXISTS "Public Update Access for All Buckets" ON storage.objects;
  DROP POLICY IF EXISTS "Public Delete Access for All Buckets" ON storage.objects;
  
  -- Create new policies with public access
  CREATE POLICY "Public Access for All Buckets" 
    ON storage.objects FOR SELECT 
    USING (true);

  CREATE POLICY "Public Upload Access for All Buckets" 
    ON storage.objects FOR INSERT 
    WITH CHECK (true);

  CREATE POLICY "Public Update Access for All Buckets" 
    ON storage.objects FOR UPDATE 
    USING (true);

  CREATE POLICY "Public Delete Access for All Buckets" 
    ON storage.objects FOR DELETE 
    USING (true);
EXCEPTION
  WHEN duplicate_object THEN
    -- Policies already exist, just inform in the logs
    RAISE NOTICE 'Some policies already exist, skipping...';
END;
$$;
