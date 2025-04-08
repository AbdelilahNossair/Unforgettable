/*
  # Initial Schema Setup for Facial Recognition Event System

  1. New Tables
    - `profiles`
      - Extended user profile data
      - Linked to auth.users
      - Stores role and profile information
      - Face embedding stored as numeric array
    
    - `events`
      - Event details
      - QR code information
      - Status tracking
    
    - `photos`
      - Event photos
      - Processing status
      - Upload metadata
    
    - `faces`
      - Facial recognition data
      - Embeddings storage
      - Confidence scores
    
    - `event_attendees`
      - Event attendance tracking
      - Registration status
    
  2. Security
    - RLS policies for each table
    - Role-based access control
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
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
CREATE TABLE IF NOT EXISTS events (
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
CREATE TABLE IF NOT EXISTS photos (
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
CREATE TABLE IF NOT EXISTS faces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id uuid REFERENCES photos(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id),
  embedding numeric[] NOT NULL,
  confidence float NOT NULL,
  bbox jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create event_attendees table
CREATE TABLE IF NOT EXISTS event_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id),
  registration_date timestamptz DEFAULT now(),
  attendance_confirmed boolean DEFAULT false,
  attendance_confirmed_at timestamptz,
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE faces ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Events policies
CREATE POLICY "Events are viewable by everyone" ON events
  FOR SELECT USING (true);

CREATE POLICY "Admins can create events" ON events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update events" ON events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Photos policies
CREATE POLICY "Photos are viewable by event attendees" ON photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM event_attendees
      WHERE event_id = photos.event_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Photographers can upload photos" ON photos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'photographer'
    )
  );

-- Faces policies
CREATE POLICY "Users can view their own faces" ON faces
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can manage faces" ON faces
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Event attendees policies
CREATE POLICY "Users can view their own attendance" ON event_attendees
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can register for events" ON event_attendees
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();