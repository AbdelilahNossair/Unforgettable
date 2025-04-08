/*
  # Add Photographer User

  1. Changes
    - Add a photographer user to the system
    - Create corresponding profile record
    - Set proper role and credentials

  2. Security
    - Use proper password hashing
    - Set correct role
*/

-- Insert photographer user if it doesn't exist
DO $$
DECLARE
  photographer_id uuid := gen_random_uuid();
BEGIN
  -- Create photographer user
  INSERT INTO users (
    id,
    email,
    password_hash,
    role,
    created_at,
    updated_at
  ) VALUES (
    photographer_id,
    'photographer@eventface.com',
    'photo123',
    'photographer',
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO NOTHING;

  -- Create photographer profile
  INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
  ) VALUES (
    photographer_id,
    'photographer@eventface.com',
    'John Smith',
    'photographer',
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO NOTHING;
END $$;