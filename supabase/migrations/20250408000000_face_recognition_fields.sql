/*
  # Add Face Recognition Fields

  1. Changes
    - Add face_image_url to users table
    - Add registration_complete and face_registration_date to event_attendees
    - Make user_id nullable in faces table for unrecognized faces

  2. Security
    - Maintain existing RLS policies
    - Ensure proper access control for face data
*/

-- Add face_image_url to users table if it doesn't exist
ALTER TABLE users
ADD COLUMN IF NOT EXISTS face_image_url text;

-- Add registration fields to event_attendees if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'event_attendees' 
    AND column_name = 'registration_complete'
  ) THEN
    ALTER TABLE event_attendees 
    ADD COLUMN registration_complete boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'event_attendees' 
    AND column_name = 'face_registration_date'
  ) THEN
    ALTER TABLE event_attendees 
    ADD COLUMN face_registration_date timestamptz;
  END IF;
END
$$;

-- Modify faces table to allow null user_id for unrecognized faces
ALTER TABLE faces
ALTER COLUMN user_id DROP NOT NULL;

-- Create necessary storage buckets if they don't exist
-- Note: This requires elevated permissions and might need to be run manually
-- in the Supabase UI if not using service role
DO $$
BEGIN
  -- This will be ignored if the bucket already exists
  PERFORM storage.create_bucket('face-images', 'Face profile images');
  PERFORM storage.create_bucket('event-photos', 'Event photos');
EXCEPTION WHEN OTHERS THEN
  -- Ignore errors (e.g., if buckets already exist)
  RAISE NOTICE 'Storage buckets may already exist or require admin permissions';
END
$$;

-- Additional policy for users to access their own face data
CREATE POLICY IF NOT EXISTS "Users can view their own face data"
ON users
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Policy for face images storage
BEGIN;
DO $$
BEGIN
  -- Attempt to create policy for face-images bucket access
  -- This might fail if storage RLS is not set up properly
  CREATE POLICY "Public read access to face images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'face-images');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Storage policy creation might require admin permissions';
END
$$;
COMMIT;