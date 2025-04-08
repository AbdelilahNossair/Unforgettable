/*
  # Reset Database and Setup Schema

  1. Changes
    - Drop all existing tables
    - Recreate tables with proper structure
    - Enable RLS and create policies
    - Add timestamp update triggers
    - Add initial users with proper error handling

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each role
    - Secure user data access
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

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Events are viewable by everyone" 
ON public.events FOR SELECT 
USING (true);

CREATE POLICY "Admins can create events" 
ON public.events FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update events" 
ON public.events FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Photos are viewable by event attendees" 
ON public.photos FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.event_attendees
    WHERE event_id = photos.event_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Photographers can upload photos" 
ON public.photos FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'photographer'
  )
);

CREATE POLICY "Users can view their own faces" 
ON public.faces FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "System can manage faces" 
ON public.faces FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Users can view their own attendance" 
ON public.event_attendees FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can register for events" 
ON public.event_attendees FOR INSERT 
WITH CHECK (auth.uid() = user_id);

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