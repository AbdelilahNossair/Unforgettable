/*
  # Add Storage Policies for Events Bucket

  1. Changes
    - Add storage policies for the events bucket
    - Fix type casting between text and UUID for auth.uid()
    - Allow authenticated users to upload images
    - Allow users to read public images
    - Allow users to update/delete their own images

  2. Security
    - Restrict uploads to authenticated users
    - Ensure users can only manage their own images
*/

-- Create policies for the events storage bucket
BEGIN;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated uploads
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'events' AND
  auth.role() = 'authenticated'
);

-- Policy to allow public read access to files
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'events');

-- Policy to allow users to update their own files
CREATE POLICY "Allow users to update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'events' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'events' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy to allow users to delete their own files
CREATE POLICY "Allow users to delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'events' AND auth.uid()::text = (storage.foldername(name))[1]);

COMMIT;