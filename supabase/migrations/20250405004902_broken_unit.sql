/*
  # Update Events Schema

  1. Changes
    - Add new fields to events table:
      - event_time: For specific time of event
      - image_url: For event banner/promotional image
      - host_type: Company or Individual
      - host_name: Name of host
      - expected_attendees: Number of expected attendees
      - end_date: For event duration

  2. Security
    - Maintain existing RLS policies
    - Add constraints for new fields
*/

-- Add new columns to events table
ALTER TABLE events
ADD COLUMN event_time time,
ADD COLUMN image_url text,
ADD COLUMN host_type text CHECK (host_type IN ('company', 'individual')),
ADD COLUMN host_name text NOT NULL DEFAULT '',
ADD COLUMN expected_attendees integer DEFAULT 0,
ADD COLUMN end_date timestamptz;

-- Update existing events with default values
UPDATE events
SET 
  event_time = '00:00:00',
  host_type = 'company',
  host_name = 'Unknown Host',
  expected_attendees = 0,
  end_date = date + interval '2 hours'
WHERE event_time IS NULL;

-- Make new columns required for future inserts
ALTER TABLE events
ALTER COLUMN event_time SET NOT NULL,
ALTER COLUMN host_type SET NOT NULL,
ALTER COLUMN expected_attendees SET NOT NULL,
ALTER COLUMN end_date SET NOT NULL;