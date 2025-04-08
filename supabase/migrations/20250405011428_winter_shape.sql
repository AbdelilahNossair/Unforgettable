/*
  # Make Storage Bucket Completely Public

  1. Changes
    - Drop all existing storage policies
    - Create single public policy for all operations
    - No authentication checks
*/

BEGIN;

-- Drop all existing policies
DROP POLICY IF EXISTS "authenticated_uploads" ON storage.objects;
DROP POLICY IF EXISTS "public_read" ON storage.objects;
DROP POLICY IF EXISTS "users_update_own" ON storage.objects;
DROP POLICY IF EXISTS "users_delete_own" ON storage.objects;
DROP POLICY IF EXISTS "admin_photographer_uploads" ON storage.objects;
DROP POLICY IF EXISTS "public_read_access" ON storage.objects;
DROP POLICY IF EXISTS "admin_manage_all" ON storage.objects;
DROP POLICY IF EXISTS "photographer_manage_own" ON storage.objects;

-- Enable RLS (required even for public access)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create a single policy that allows all operations for the event-images bucket
CREATE POLICY "public_full_access"
ON storage.objects
FOR ALL
TO public
USING (bucket_id = 'event-images')
WITH CHECK (bucket_id = 'event-images');

COMMIT;