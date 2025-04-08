/*
  # Create Initial Users

  1. Changes
    - Create admin, photographer, and attendee users
    - Create corresponding profiles
    - Handle existing users to prevent duplicates

  2. Security
    - Use proper password hashing
    - Set correct roles and metadata
*/

-- Create initial users with proper error handling
DO $$
DECLARE
  admin_id uuid := '00000000-0000-0000-0000-000000000001';
  photo_id uuid := '00000000-0000-0000-0000-000000000002';
  user_id uuid := '00000000-0000-0000-0000-000000000003';
BEGIN
  -- Delete existing users if they exist
  DELETE FROM auth.users WHERE id IN (admin_id, photo_id, user_id);
  
  -- Create admin user
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud,
    confirmation_token
  ) VALUES (
    admin_id,
    '00000000-0000-0000-0000-000000000000',
    'admin@eventface.com',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"role": "admin"}',
    NOW(),
    NOW(),
    'authenticated',
    'authenticated',
    ''
  );

  -- Create photographer user
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud,
    confirmation_token
  ) VALUES (
    photo_id,
    '00000000-0000-0000-0000-000000000000',
    'photo@eventface.com',
    crypt('photo123', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"role": "photographer"}',
    NOW(),
    NOW(),
    'authenticated',
    'authenticated',
    ''
  );

  -- Create attendee user
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud,
    confirmation_token
  ) VALUES (
    user_id,
    '00000000-0000-0000-0000-000000000000',
    'user@eventface.com',
    crypt('user123', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"role": "attendee"}',
    NOW(),
    NOW(),
    'authenticated',
    'authenticated',
    ''
  );

  -- Create corresponding profiles
  INSERT INTO public.profiles (id, email, role, created_at, updated_at)
  VALUES
    (admin_id, 'admin@eventface.com', 'admin', NOW(), NOW()),
    (photo_id, 'photo@eventface.com', 'photographer', NOW(), NOW()),
    (user_id, 'user@eventface.com', 'attendee', NOW(), NOW());

EXCEPTION WHEN OTHERS THEN
  -- Log error and re-raise
  RAISE NOTICE 'Error creating users: %', SQLERRM;
  RAISE;
END $$;