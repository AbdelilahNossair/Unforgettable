/*
  # Fix Storage Policies for Event Images Bucket

  1. Changes
    - Drop existing policies to start fresh
    - Add proper policies for event image uploads
    - Fix bucket name to 'event-images'
    - Ensure proper role-based access

  2. Security
    - Allow admins and photographers to manage all files
    - Maintain public read access
    - Remove complex path/owner checks
*/

-- Create policies for the event-images storage bucket
BEGIN;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "authenticated_uploads" ON storage.objects;
DROP POLICY IF EXISTS "public_read" ON storage.objects;
DROP POLICY IF EXISTS "users_update_own" ON storage.objects;
DROP POLICY IF EXISTS "users_delete_own" ON storage.objects;
DROP POLICY IF EXISTS "admin_photographer_uploads" ON storage.objects;
DROP POLICY IF EXISTS "public_read_access" ON storage.objects;
DROP POLICY IF EXISTS "admin_manage_all" ON storage.objects;
DROP POLICY IF EXISTS "photographer_manage_own" ON storage.objects;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow admins and photographers to upload files
CREATE POLICY "admin_photographer_uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-images' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'photographer')
  )
);

-- Policy to allow public read access to files
CREATE POLICY "public_read_access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-images');

-- Policy to allow admins to manage all files
CREATE POLICY "admin_manage_all"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'event-images' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy to allow photographers to manage their own files
CREATE POLICY "photographer_manage_own"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'event-images' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'photographer'
  )
);

COMMIT;