/*
  # Fix user authentication setup

  1. Changes
    - Create users table with proper structure
    - Add trigger for timestamp updates
    - Insert demo users with correct password hashes
    - Update foreign key constraints

  2. Security
    - Store properly hashed passwords using bcrypt
    - Set up initial admin, photographer, and attendee accounts
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

-- Create trigger for updating updated_at only if it doesn't exist
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

-- Insert admin user with correct password hash
-- Password: admin123
INSERT INTO users (id, email, password_hash, role, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@eventface.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'admin',
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash;

-- Insert photographer user
-- Password: photo123
INSERT INTO users (id, email, password_hash, role, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'photo@eventface.com',
  '$2a$10$DJz.w6nL0gRRHCQZHPpVwOHiZ0zEJ2RHeDRTCKjcQ.hp/G0yXHALm',
  'photographer',
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash;

-- Insert attendee user
-- Password: user123
INSERT INTO users (id, email, password_hash, role, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  'user@eventface.com',
  '$2a$10$Lcj1Cq9ldWV4bKrnxzVHqe1uDQwpYYk.bXQWi/Jv0V.NPxBRKQH6O',
  'attendee',
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash;

-- Remove existing foreign key constraint from profiles if it exists
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Add new foreign key constraint
ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE;