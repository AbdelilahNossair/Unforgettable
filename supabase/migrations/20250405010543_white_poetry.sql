/*
  # Update Storage Policies for Events Bucket

  1. Changes
    - Drop existing policies to avoid conflicts
    - Recreate policies with proper permissions
    - Fix type casting issues
    - Ensure proper role-based access

  2. Security
    - Maintain public read access
    - Restrict uploads to authenticated users
    - Allow proper file management
*/

-- Create policies for the events storage bucket
BEGIN;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own files" ON storage.objects;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated uploads
CREATE POLICY "authenticated_uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'events' AND
  auth.role() = 'authenticated'
);

-- Policy to allow public read access to files
CREATE POLICY "public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'events');

-- Policy to allow users to update their own files
CREATE POLICY "users_update_own"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'events' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'events' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy to allow users to delete their own files
CREATE POLICY "users_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'events' AND auth.uid()::text = (storage.foldername(name))[1]);

COMMIT;