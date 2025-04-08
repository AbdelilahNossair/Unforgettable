/*
  # Database Schema Without RLS

  1. Changes
    - Drop existing tables
    - Recreate tables without RLS
    - Add foreign key constraints
    - Add check constraints
    - Create timestamp update triggers
    - Add initial users
*/

-- Drop existing tables in correct order
DROP TABLE IF EXISTS public.event_attendees CASCADE;
DROP TABLE IF EXISTS public.faces CASCADE;
DROP TABLE IF EXISTS public.photos CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Recreate profiles table with proper structure
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  role text NOT NULL CHECK (role IN ('admin', 'photographer', 'attendee')),
  face_embedding numeric[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create events table
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  date timestamptz NOT NULL,
  location text NOT NULL,
  qr_code text UNIQUE,
  status text NOT NULL CHECK (status IN ('upcoming', 'active', 'completed', 'archived')),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create photos table
CREATE TABLE public.photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  url text NOT NULL,
  uploaded_by uuid REFERENCES profiles(id),
  processed boolean DEFAULT false,
  processing_started_at timestamptz,
  processing_completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create faces table
CREATE TABLE public.faces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id uuid REFERENCES photos(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id),
  embedding numeric[] NOT NULL,
  confidence float NOT NULL,
  bbox jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create event_attendees table
CREATE TABLE public.event_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id),
  registration_date timestamptz DEFAULT now(),
  attendance_confirmed boolean DEFAULT false,
  attendance_confirmed_at timestamptz,
  UNIQUE(event_id, user_id)
);

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create initial users
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
  RAISE NOTICE 'Error creating users: %', SQLERRM;
  RAISE;
END $$;