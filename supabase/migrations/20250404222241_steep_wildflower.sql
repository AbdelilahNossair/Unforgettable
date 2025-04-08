/*
  # Fix authentication schema relationship

  1. Changes
    - Add foreign key relationship between auth.users and public.profiles
    - Ensure profiles table has correct constraints for auth

  2. Security
    - Maintain existing RLS policies
    - Ensure proper authentication flow
*/

-- Create extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure the auth schema exists
CREATE SCHEMA IF NOT EXISTS auth;

-- Drop the existing foreign key if it exists
ALTER TABLE IF EXISTS public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Add the correct foreign key relationship
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Ensure the email in profiles matches the email in auth.users
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'attendee')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_auth_user_created();
  END IF;
END
$$;