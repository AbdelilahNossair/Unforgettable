/*
  # Add Face Registration Support

  1. Changes
    - Add face_image_url to users table for profile photos
    - Add face_embedding column for storing facial recognition data
    - Add registration_complete flag to event_attendees
    - Add face_registration_date to event_attendees

  2. Security
    - Maintain existing RLS policies
    - Add policies for face data access
*/

-- Add new columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS face_image_url text,
ADD COLUMN IF NOT EXISTS face_embedding numeric[];

-- Add new columns to event_attendees
ALTER TABLE event_attendees
ADD COLUMN IF NOT EXISTS registration_complete boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS face_registration_date timestamptz;

-- Create policy for face data access
CREATE POLICY "Users can access their own face data"
ON users
FOR ALL
TO authenticated
USING (id = auth.uid());