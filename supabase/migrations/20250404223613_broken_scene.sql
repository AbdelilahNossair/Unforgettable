/*
  # Reset users table with plain passwords
  
  1. Changes
    - Drop and recreate users table
    - Store passwords directly without hashing
    - Update foreign key constraints
*/

-- Drop existing users table
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'photographer', 'attendee')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create trigger for updating updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_users_updated_at'
  ) THEN
    CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;
END
$$;

-- Insert users with plain passwords
INSERT INTO users (id, email, password_hash, role, created_at, updated_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'admin@eventface.com',
    'admin123',
    'admin',
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'photo@eventface.com',
    'photo123',
    'photographer',
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'user@eventface.com',
    'user123',
    'attendee',
    NOW(),
    NOW()
  )
ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash;

-- Remove existing foreign key constraint from profiles if it exists
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Add new foreign key constraint
ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE;