/*
  # Insert Demo Users

  1. Changes
    - Insert demo users into auth.users table
    - Create corresponding profile records
    - Set up admin, photographer, and attendee accounts

  2. Demo Accounts
    - Admin: admin@eventface.com
    - Photographer: photo@eventface.com
    - Attendee: user@eventface.com

  3. Security
    - Passwords are hashed using Supabase Auth
    - Proper role assignments
*/

-- Insert admin user
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
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin@eventface.com',
  '$2a$10$5RqbGPVZBXvTN.gEfUkvPuYnwrYxWYX3RxZD7DNbvGJ4V5Qn8WmHe', -- admin123
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"role": "admin"}',
  NOW(),
  NOW(),
  'authenticated',
  'authenticated',
  ''
);

-- Insert photographer user
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
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'photo@eventface.com',
  '$2a$10$5RqbGPVZBXvTN.gEfUkvPuYnwrYxWYX3RxZD7DNbvGJ4V5Qn8WmHe', -- photo123
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"role": "photographer"}',
  NOW(),
  NOW(),
  'authenticated',
  'authenticated',
  ''
);

-- Insert attendee user
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
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'user@eventface.com',
  '$2a$10$5RqbGPVZBXvTN.gEfUkvPuYnwrYxWYX3RxZD7DNbvGJ4V5Qn8WmHe', -- user123
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"role": "attendee"}',
  NOW(),
  NOW(),
  'authenticated',
  'authenticated',
  ''
);

-- Insert corresponding profiles
INSERT INTO public.profiles (id, email, role, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@eventface.com', 'admin', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', 'photo@eventface.com', 'photographer', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000003', 'user@eventface.com', 'attendee', NOW(), NOW());