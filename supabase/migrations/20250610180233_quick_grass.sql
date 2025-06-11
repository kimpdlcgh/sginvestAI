/*
  # Trading Platform Database Schema - Fixed Migration

  1. New Tables
    - `profiles` - Extended user profiles with investment preferences
    - `portfolio_holdings` - Individual asset holdings
    - `trades` - Trade history and execution records
    - `assets` - Market data for tradeable assets

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Properly handle existing policies

  3. Performance
    - Add indexes for frequently queried columns
    - Optimized for trading platform operations
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing policies to avoid conflicts
DO $$
BEGIN
    -- Drop policies for profiles if they exist
    DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    
    -- Drop policies for portfolio_holdings if they exist
    DROP POLICY IF EXISTS "Users can insert own holdings" ON portfolio_holdings;
    DROP POLICY IF EXISTS "Users can read own holdings" ON portfolio_holdings;
    DROP POLICY IF EXISTS "Users can update own holdings" ON portfolio_holdings;
    DROP POLICY IF EXISTS "Users can delete own holdings" ON portfolio_holdings;
    
    -- Drop policies for trades if they exist
    DROP POLICY IF EXISTS "Users can insert own trades" ON trades;
    DROP POLICY IF EXISTS "Users can read own trades" ON trades;
    DROP POLICY IF EXISTS "Users can update own trades" ON trades;
    
    -- Drop policies for assets if they exist
    DROP POLICY IF EXISTS "Anyone can read assets" ON assets;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors if policies don't exist
        NULL;
END $$;

-- Profiles table
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

-- Portfolio Holdings table
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

-- Trades table
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

-- Assets table
CREATE TABLE IF NOT EXISTS assets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol text UNIQUE NOT NULL,
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('stock', 'forex', 'commodity', 'bond', 'crypto')),
    price numeric(15,8) NOT NULL,
    change numeric(15,8) DEFAULT 0,
    change_percent numeric(8,4) DEFAULT 0,
    volume bigint DEFAULT 0,
    market_cap bigint,
    last_updated timestamptz DEFAULT now(),
    bid numeric(15,8),
    ask numeric(15,8),
    high_24h numeric(15,8),
    low_24h numeric(15,8),
    volatility numeric(8,4),
    beta numeric(8,4),
    pe numeric(8,2),
    eps numeric(8,4)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own profile" ON profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id);

-- RLS Policies for portfolio_holdings
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

-- RLS Policies for trades
CREATE POLICY "Users can insert own trades" ON trades
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own trades" ON trades
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own trades" ON trades
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

-- RLS Policies for assets (public read access)
CREATE POLICY "Anyone can read assets" ON assets
    FOR SELECT TO authenticated
    USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_user_id ON portfolio_holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_symbol ON portfolio_holdings(symbol);
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_user_id_symbol ON portfolio_holdings(user_id, symbol);
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades(created_at);
CREATE INDEX IF NOT EXISTS idx_assets_symbol ON assets(symbol);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);

-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_portfolio_holdings_updated_at ON portfolio_holdings;
DROP TRIGGER IF EXISTS update_trades_updated_at ON trades;

-- Create triggers for updating timestamps
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_holdings_updated_at
    BEFORE UPDATE ON portfolio_holdings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trades_updated_at
    BEFORE UPDATE ON trades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample assets for testing
INSERT INTO assets (symbol, name, type, price, change, change_percent, volume, market_cap) VALUES
('AAPL', 'Apple Inc.', 'stock', 150.00, 2.50, 1.69, 50000000, 2500000000000),
('GOOGL', 'Alphabet Inc.', 'stock', 2800.00, -15.25, -0.54, 1200000, 1800000000000),
('MSFT', 'Microsoft Corporation', 'stock', 330.00, 5.75, 1.77, 25000000, 2400000000000),
('TSLA', 'Tesla, Inc.', 'stock', 800.00, -12.50, -1.54, 35000000, 800000000000),
('AMZN', 'Amazon.com, Inc.', 'stock', 3200.00, 45.00, 1.43, 3500000, 1600000000000),
('NVDA', 'NVIDIA Corporation', 'stock', 220.00, 8.25, 3.90, 45000000, 550000000000),
('META', 'Meta Platforms, Inc.', 'stock', 320.00, -5.50, -1.69, 18000000, 850000000000),
('NFLX', 'Netflix, Inc.', 'stock', 450.00, 12.75, 2.92, 8000000, 200000000000)
ON CONFLICT (symbol) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    change = EXCLUDED.change,
    change_percent = EXCLUDED.change_percent,
    volume = EXCLUDED.volume,
    market_cap = EXCLUDED.market_cap,
    last_updated = now();