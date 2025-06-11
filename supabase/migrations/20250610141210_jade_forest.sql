/*
  # Investment Dashboard Schema Setup

  1. New Tables
    - `profiles` - Extended user profiles with investment preferences
    - `portfolio_holdings` - Individual asset holdings (separate from existing portfolios)
    - `trades` - Trade history and execution records
    - `watchlists` - User asset watchlists

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own data

  3. Functions & Triggers
    - Auto-create profile on user signup
    - Update timestamps automatically
*/

-- Create profiles table for extended user information
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
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

-- Create portfolio_holdings table (separate from existing portfolios table)
CREATE TABLE IF NOT EXISTS portfolio_holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  portfolio_id uuid REFERENCES portfolios(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  name text NOT NULL,
  shares numeric NOT NULL DEFAULT 0,
  average_price numeric NOT NULL DEFAULT 0,
  current_price numeric NOT NULL DEFAULT 0,
  sector text DEFAULT 'Technology',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, symbol)
);

-- Create trades table for trade history
CREATE TABLE IF NOT EXISTS trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  portfolio_id uuid REFERENCES portfolios(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('buy', 'sell')),
  order_type text NOT NULL CHECK (order_type IN ('market', 'limit', 'stop')),
  quantity integer NOT NULL,
  price numeric NOT NULL,
  total numeric NOT NULL,
  status text NOT NULL DEFAULT 'executed' CHECK (status IN ('executed', 'pending', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create watchlists table for user asset watchlists
CREATE TABLE IF NOT EXISTS watchlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  symbol text NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, symbol)
);

-- Enable Row Level Security on all new tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (safe approach)
DO $$
BEGIN
  -- Drop policies for profiles
  DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
  
  -- Drop policies for portfolio_holdings
  DROP POLICY IF EXISTS "Users can read own holdings" ON portfolio_holdings;
  DROP POLICY IF EXISTS "Users can insert own holdings" ON portfolio_holdings;
  DROP POLICY IF EXISTS "Users can update own holdings" ON portfolio_holdings;
  DROP POLICY IF EXISTS "Users can delete own holdings" ON portfolio_holdings;
  
  -- Drop policies for trades
  DROP POLICY IF EXISTS "Users can read own trades" ON trades;
  DROP POLICY IF EXISTS "Users can insert own trades" ON trades;
  DROP POLICY IF EXISTS "Users can update own trades" ON trades;
  
  -- Drop policies for watchlists
  DROP POLICY IF EXISTS "Users can read own watchlist" ON watchlists;
  DROP POLICY IF EXISTS "Users can insert own watchlist" ON watchlists;
  DROP POLICY IF EXISTS "Users can delete own watchlist" ON watchlists;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore errors if policies don't exist
    NULL;
END $$;

-- Create policies for profiles
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create policies for portfolio_holdings
CREATE POLICY "Users can read own holdings"
  ON portfolio_holdings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own holdings"
  ON portfolio_holdings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own holdings"
  ON portfolio_holdings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own holdings"
  ON portfolio_holdings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for trades
CREATE POLICY "Users can read own trades"
  ON trades
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades"
  ON trades
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trades"
  ON trades
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for watchlists
CREATE POLICY "Users can read own watchlist"
  ON watchlists
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watchlist"
  ON watchlists
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own watchlist"
  ON watchlists
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Drop existing triggers and functions if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_portfolio_holdings_updated_at ON portfolio_holdings;
DROP TRIGGER IF EXISTS update_trades_updated_at ON trades;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_holdings_updated_at
  BEFORE UPDATE ON portfolio_holdings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trades_updated_at
  BEFORE UPDATE ON trades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();