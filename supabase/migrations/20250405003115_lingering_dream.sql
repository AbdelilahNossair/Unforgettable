/*
  # Add event creation policy

  1. Security Changes
    - Add RLS policy to allow authenticated users to create events
    - The policy ensures that the created_by field matches the user's ID

  2. Notes
    - This complements existing policies:
      - "Admins can manage events" (ALL operations)
      - "Anyone can read events" (SELECT only)
    - New policy specifically handles INSERT operations
*/

CREATE POLICY "Users can create events"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by
  );