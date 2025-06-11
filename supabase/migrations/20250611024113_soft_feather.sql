/*
  # Fix Authentication Setup

  1. New Tables
    - Ensures `profiles` table exists with proper structure
    - Ensures `user_profiles` table exists for extended user data
    - Creates default watchlist functionality

  2. Security
    - Enable RLS on all tables
    - Add proper policies for authenticated users
    - Ensure users can only access their own data

  3. Triggers
    - Auto-create profile on user signup
    - Auto-create default watchlist
    - Handle updated_at timestamps

  4. Functions
    - Profile creation trigger function
    - Default watchlist creation
    - Updated timestamp function
*/

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  first_name text,
  last_name text,
  middle_name text,
  date_of_birth date,
  gender text,
  nationality text,
  primary_phone text,
  secondary_phone text,
  whatsapp_number text,
  emergency_contact text,
  primary_address jsonb,
  mailing_address jsonb,
  language text DEFAULT 'English (US)',
  timezone text DEFAULT 'America/New_York (EST)',
  currency text DEFAULT 'USD',
  date_format text DEFAULT 'MM/DD/YYYY',
  number_format text DEFAULT 'US',
  week_start text DEFAULT 'Sunday',
  risk_tolerance text,
  investment_experience text,
  investment_horizon text,
  annual_income text,
  net_worth text,
  employment_status text,
  profile_completion integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create profiles policies
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "profiles_read_policy" ON profiles;
  DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
  DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
  
  -- Create new policies
  CREATE POLICY "profiles_read_policy" ON profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);
    
  CREATE POLICY "profiles_insert_policy" ON profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);
    
  CREATE POLICY "profiles_update_policy" ON profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id);
END $$;

-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  first_name text,
  last_name text,
  phone text,
  date_of_birth date,
  account_type text DEFAULT 'individual' CHECK (account_type IN ('individual', 'business', 'joint')),
  risk_tolerance text DEFAULT 'moderate' CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive')),
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create user_profiles policies
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "user_profiles_read_policy" ON user_profiles;
  DROP POLICY IF EXISTS "user_profiles_insert_policy" ON user_profiles;
  DROP POLICY IF EXISTS "user_profiles_update_policy" ON user_profiles;
  
  -- Create new policies
  CREATE POLICY "user_profiles_read_policy" ON user_profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
    
  CREATE POLICY "user_profiles_insert_policy" ON user_profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);
    
  CREATE POLICY "user_profiles_update_policy" ON user_profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);
END $$;

-- Create watchlists table if it doesn't exist
CREATE TABLE IF NOT EXISTS watchlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  symbols text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  is_default boolean DEFAULT false
);

-- Enable RLS on watchlists
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;

-- Create watchlists policies
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "watchlists_all_policy" ON watchlists;
  
  -- Create new policy
  CREATE POLICY "watchlists_all_policy" ON watchlists
    FOR ALL TO authenticated
    USING (auth.uid() = user_id);
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON watchlists(user_id);

-- Create trigger functions
CREATE OR REPLACE FUNCTION create_default_watchlist()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO watchlists (user_id, name, is_default)
  VALUES (NEW.id, 'My Watchlist', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  
  -- Create user_profile
  INSERT INTO user_profiles (user_id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create default watchlist
  INSERT INTO watchlists (user_id, name, is_default)
  VALUES (NEW.id, 'My Watchlist', true)
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();