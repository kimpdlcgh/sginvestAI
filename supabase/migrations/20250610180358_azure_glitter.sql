-- Fix trigger conflict by properly dropping existing triggers and functions
-- This migration safely handles existing triggers and creates clean schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing triggers first to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_portfolio_holdings_updated_at ON portfolio_holdings;
DROP TRIGGER IF EXISTS update_trades_updated_at ON trades;

-- Drop existing functions to recreate them cleanly
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- If profile already exists, ignore the error
        RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create tables if they don't exist
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

CREATE TABLE IF NOT EXISTS portfolio_holdings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol text NOT NULL,
    name text NOT NULL,
    shares numeric DEFAULT 0 NOT NULL,
    average_price numeric DEFAULT 0 NOT NULL,
    current_price numeric DEFAULT 0 NOT NULL,
    sector text DEFAULT 'Technology',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, symbol)
);

CREATE TABLE IF NOT EXISTS trades (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol text NOT NULL,
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('buy', 'sell')),
    order_type text NOT NULL CHECK (order_type IN ('market', 'limit', 'stop')),
    quantity integer NOT NULL CHECK (quantity > 0),
    price numeric NOT NULL CHECK (price > 0),
    total numeric NOT NULL,
    status text DEFAULT 'executed' CHECK (status IN ('executed', 'pending', 'cancelled')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS if not already enabled
DO $$
BEGIN
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE portfolio_holdings ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Drop existing policies to avoid conflicts
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can insert own holdings" ON portfolio_holdings;
    DROP POLICY IF EXISTS "Users can read own holdings" ON portfolio_holdings;
    DROP POLICY IF EXISTS "Users can update own holdings" ON portfolio_holdings;
    DROP POLICY IF EXISTS "Users can delete own holdings" ON portfolio_holdings;
    DROP POLICY IF EXISTS "Users can insert own trades" ON trades;
    DROP POLICY IF EXISTS "Users can read own trades" ON trades;
    DROP POLICY IF EXISTS "Users can update own trades" ON trades;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Create RLS policies
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own profile" ON profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own holdings" ON portfolio_holdings
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own holdings" ON portfolio_holdings
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own holdings" ON portfolio_holdings
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own holdings" ON portfolio_holdings
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades" ON trades
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own trades" ON trades
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own trades" ON trades
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_user_id ON portfolio_holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_symbol ON portfolio_holdings(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades(created_at);

-- Now create triggers (after dropping them above)
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_holdings_updated_at
    BEFORE UPDATE ON portfolio_holdings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trades_updated_at
    BEFORE UPDATE ON trades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create the user signup trigger (this was causing the conflict)
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();