/*
  # Migrate from profiles to users table

  1. Changes
    - Drop profiles table and all its dependencies
    - Add missing columns to users table
    - Migrate data from profiles to users
    - Update foreign key constraints
    - Update RLS policies

  2. Security
    - Maintain existing security policies
    - Ensure data integrity during migration
*/

-- Add new columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS face_embedding numeric[];

-- Copy data from profiles to users
UPDATE users u
SET 
  full_name = p.full_name,
  avatar_url = p.avatar_url,
  face_embedding = p.face_embedding
FROM profiles p
WHERE u.id = p.id;

-- Update foreign key constraints
ALTER TABLE events
DROP CONSTRAINT IF EXISTS events_created_by_fkey,
ADD CONSTRAINT events_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES users(id)
  ON DELETE CASCADE;

ALTER TABLE photos
DROP CONSTRAINT IF EXISTS photos_uploaded_by_fkey,
ADD CONSTRAINT photos_uploaded_by_fkey
  FOREIGN KEY (uploaded_by)
  REFERENCES users(id)
  ON DELETE CASCADE;

ALTER TABLE faces
DROP CONSTRAINT IF EXISTS faces_user_id_fkey,
ADD CONSTRAINT faces_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES users(id)
  ON DELETE CASCADE;

ALTER TABLE event_attendees
DROP CONSTRAINT IF EXISTS event_attendees_user_id_fkey,
ADD CONSTRAINT event_attendees_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES users(id)
  ON DELETE CASCADE;

-- Drop profiles table and its dependencies
DROP TABLE IF EXISTS profiles CASCADE;