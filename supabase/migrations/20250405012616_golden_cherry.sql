/*
  # Add QR Code Support for Events

  1. Changes
    - Remove end_date column from events table
    - Add qr_code column to events table
    - Update existing events with unique QR codes
*/

-- Remove end_date column
ALTER TABLE events DROP COLUMN IF EXISTS end_date;

-- Add qr_code column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'events' 
    AND column_name = 'qr_code'
  ) THEN
    ALTER TABLE events ADD COLUMN qr_code text UNIQUE;
  END IF;
END
$$;

-- Update existing events with QR codes
UPDATE events 
SET qr_code = 'https://eventface.app/events/' || id
WHERE qr_code IS NULL;

-- Make qr_code required for future inserts
ALTER TABLE events ALTER COLUMN qr_code SET NOT NULL;