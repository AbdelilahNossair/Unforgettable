/*
  # Update Events RLS Policy

  1. Changes
    - Drop existing insert policy
    - Create new policy that checks both user role and created_by field
    - Allow only admins and photographers to create events

  2. Security
    - Ensures proper role-based access control
    - Maintains data integrity by linking events to creators
*/

-- Drop existing insert policy if it exists
DROP POLICY IF EXISTS "Users can create events" ON events;

-- Create new policy with role check
CREATE POLICY "Admins and photographers can create events"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'photographer')
    )
  );