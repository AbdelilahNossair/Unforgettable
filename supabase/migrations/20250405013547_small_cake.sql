/*
  # Add Event Photographers Relationship

  1. Changes
    - Create event_photographers junction table
    - Add foreign key constraints
    - Add RLS policies for photographer management

  2. Security
    - Only admins can assign photographers
    - Photographers can view their assigned events
*/

-- Create event_photographers junction table
CREATE TABLE event_photographers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  photographer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(event_id, photographer_id)
);

-- Enable RLS
ALTER TABLE event_photographers ENABLE ROW LEVEL SECURITY;

-- Policies for event_photographers
CREATE POLICY "Admins can manage photographer assignments"
  ON event_photographers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Photographers can view their assignments"
  ON event_photographers
  FOR SELECT
  TO authenticated
  USING (
    photographer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );