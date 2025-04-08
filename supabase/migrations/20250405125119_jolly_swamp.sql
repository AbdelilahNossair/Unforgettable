/*
  # Update event_photographers table to reference users

  1. Changes
    - Drop existing foreign key constraints
    - Update foreign key to reference users table
    - Update existing data if needed
*/

-- Drop existing foreign key if it exists
ALTER TABLE event_photographers 
DROP CONSTRAINT IF EXISTS event_photographers_photographer_id_fkey;

-- Add new foreign key constraint to users table
ALTER TABLE event_photographers
ADD CONSTRAINT event_photographers_photographer_id_fkey 
FOREIGN KEY (photographer_id) 
REFERENCES users(id) 
ON DELETE CASCADE;