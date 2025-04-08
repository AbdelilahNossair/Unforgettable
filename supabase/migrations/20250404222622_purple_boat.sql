/*
  # Add users table and migrate profiles

  1. Changes
    - Create users table for basic authentication
    - Migrate existing profile data to users table
    - Update foreign key constraints
    - Add trigger for updated_at

  2. Data Migration
    - Copy existing profile data to users table
    - Ensure referential integrity
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'photographer', 'attendee')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create trigger for updating updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Migrate existing profiles to users table
INSERT INTO users (id, email, password_hash, role, created_at, updated_at)
SELECT 
  p.id,
  p.email,
  '$2a$10$default_hash_for_migration', -- Default hashed password: 'changeme'
  p.role,
  p.created_at,
  p.updated_at
FROM profiles p
ON CONFLICT (id) DO NOTHING;

-- Remove existing foreign key constraint from profiles if it exists
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Add new foreign key constraint
ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE;