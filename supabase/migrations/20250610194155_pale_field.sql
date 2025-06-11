-- Complete Investment Dashboard Schema
-- This migration creates all necessary tables for the investment dashboard application

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables to start fresh (in correct dependency order)
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS farms CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS positions CASCADE;
DROP TABLE IF EXISTS trades CASCADE;
DROP TABLE IF EXISTS portfolio_holdings CASCADE;
DROP TABLE IF EXISTS portfolios CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS watchlists CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing functions and triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_user_update() CASCADE;
DROP FUNCTION IF EXISTS public.create_default_portfolio() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Create trigger functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create profiles table (main user profiles linked to auth.users)
CREATE TABLE profiles (
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

-- Create portfolio_holdings table (main portfolio data)
CREATE TABLE portfolio_holdings (
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

-- Create trades table (trading history)
CREATE TABLE trades (
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

-- Create assets table (market data)
CREATE TABLE assets (
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

-- Create watchlists table
CREATE TABLE watchlists (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    symbols text[] DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    is_default boolean DEFAULT false
);

-- Create users table (custom users table for additional features)
CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    name text NOT NULL,
    role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    balance numeric(15,2) NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    is_active boolean DEFAULT true,
    risk_profile text DEFAULT 'moderate' CHECK (risk_profile IN ('conservative', 'moderate', 'aggressive')),
    trading_level text DEFAULT 'intermediate' CHECK (trading_level IN ('beginner', 'intermediate', 'advanced', 'professional')),
    phone text,
    country text,
    timezone text,
    language text DEFAULT 'English',
    date_of_birth date,
    address text,
    city text,
    postal_code text,
    occupation text,
    annual_income text,
    investment_experience text,
    profile_picture text
);

-- Create user_profiles table (extended user information)
CREATE TABLE user_profiles (
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

-- Create portfolios table
CREATE TABLE portfolios (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL DEFAULT 'My Portfolio',
    total_value numeric(15,2) DEFAULT 0.00,
    cash_balance numeric(15,2) DEFAULT 0.00,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create positions table
CREATE TABLE positions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_id uuid REFERENCES assets(id) ON DELETE CASCADE,
    symbol text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    quantity numeric(15,8) NOT NULL,
    avg_price numeric(15,8) NOT NULL,
    current_price numeric(15,8) NOT NULL,
    total_value numeric(15,2) NOT NULL,
    gain_loss numeric(15,2) NOT NULL,
    gain_loss_percent numeric(8,4) NOT NULL,
    stop_loss numeric(15,8),
    take_profit numeric(15,8),
    leverage numeric(8,2) DEFAULT 1,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_id uuid REFERENCES assets(id) ON DELETE CASCADE,
    symbol text NOT NULL,
    type text NOT NULL CHECK (type IN ('buy', 'sell')),
    quantity numeric(15,8) NOT NULL,
    price numeric(15,8) NOT NULL,
    total numeric(15,2) NOT NULL,
    fee numeric(15,2) DEFAULT 0,
    status text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
    timestamp timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_id uuid REFERENCES assets(id) ON DELETE CASCADE,
    symbol text NOT NULL,
    type text NOT NULL CHECK (type IN ('buy', 'sell')),
    order_type text NOT NULL CHECK (order_type IN ('market', 'limit', 'stop', 'stop_limit', 'trailing_stop', 'iceberg', 'bracket')),
    quantity numeric(15,8) NOT NULL,
    price numeric(15,8),
    stop_price numeric(15,8),
    trailing_amount numeric(15,8),
    iceberg_qty numeric(15,8),
    time_in_force text DEFAULT 'GTC' CHECK (time_in_force IN ('GTC', 'IOC', 'FOK', 'DAY')),
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'cancelled', 'partially_filled', 'rejected')),
    created_at timestamptz DEFAULT now(),
    expires_at timestamptz,
    fill_price numeric(15,8),
    fill_quantity numeric(15,8)
);

-- Create alerts table
CREATE TABLE alerts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol text NOT NULL,
    type text NOT NULL CHECK (type IN ('price', 'volume', 'news', 'technical')),
    condition text NOT NULL CHECK (condition IN ('above', 'below', 'crosses_above', 'crosses_below', 'equals')),
    value numeric(15,8) NOT NULL,
    is_active boolean DEFAULT true,
    triggered boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    triggered_at timestamptz,
    message text NOT NULL
);

-- Create farms table
CREATE TABLE farms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    farm_name text NOT NULL,
    farm_location text NOT NULL,
    farm_description text,
    product_types text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    unit text NOT NULL,
    stock_quantity numeric(10,2) NOT NULL,
    category text,
    image_url text,
    is_available boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create reviews table
CREATE TABLE reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid REFERENCES products(id) ON DELETE CASCADE,
    farm_id uuid REFERENCES farms(id) ON DELETE CASCADE,
    reviewer_id uuid NOT NULL,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text,
    created_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id uuid NOT NULL,
    recipient_id uuid NOT NULL,
    content text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Create order_items table
CREATE TABLE order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL,
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity numeric(10,2) NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies with unique names using auth.uid()
-- Assets (public read)
CREATE POLICY "assets_read_policy" ON assets FOR SELECT TO authenticated USING (true);

-- Profiles
CREATE POLICY "profiles_read_policy" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_update_policy" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_policy" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Portfolio holdings
CREATE POLICY "holdings_read_policy" ON portfolio_holdings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "holdings_insert_policy" ON portfolio_holdings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "holdings_update_policy" ON portfolio_holdings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "holdings_delete_policy" ON portfolio_holdings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Trades
CREATE POLICY "trades_read_policy" ON trades FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "trades_insert_policy" ON trades FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "trades_update_policy" ON trades FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Watchlists
CREATE POLICY "watchlists_all_policy" ON watchlists FOR ALL TO authenticated USING (auth.uid() = user_id);

-- User profiles
CREATE POLICY "user_profiles_read_policy" ON user_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_profiles_update_policy" ON user_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_profiles_insert_policy" ON user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Portfolios
CREATE POLICY "portfolios_read_policy" ON portfolios FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "portfolios_all_policy" ON portfolios FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Positions
CREATE POLICY "positions_read_policy" ON positions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "positions_all_policy" ON positions FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Transactions
CREATE POLICY "transactions_read_policy" ON transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "transactions_insert_policy" ON transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Orders
CREATE POLICY "orders_read_policy" ON orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "orders_all_policy" ON orders FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Alerts
CREATE POLICY "alerts_read_policy" ON alerts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "alerts_all_policy" ON alerts FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Farms
CREATE POLICY "farms_read_policy" ON farms FOR SELECT TO public USING (true);
CREATE POLICY "farms_update_policy" ON farms FOR UPDATE TO public USING (auth.uid() = user_id);
CREATE POLICY "farms_insert_policy" ON farms FOR INSERT TO public WITH CHECK (auth.uid() = user_id);

-- Products
CREATE POLICY "products_read_policy" ON products FOR SELECT TO public USING (true);
CREATE POLICY "products_update_policy" ON products FOR UPDATE TO public USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = products.farm_id AND farms.user_id = auth.uid()));
CREATE POLICY "products_insert_policy" ON products FOR INSERT TO public WITH CHECK (EXISTS (SELECT 1 FROM farms WHERE farms.id = products.farm_id AND farms.user_id = auth.uid()));

-- Reviews
CREATE POLICY "reviews_read_policy" ON reviews FOR SELECT TO public USING (true);

-- Messages
CREATE POLICY "messages_read_policy" ON messages FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "messages_insert_policy" ON messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "messages_update_policy" ON messages FOR UPDATE TO authenticated USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Order items
CREATE POLICY "order_items_read_policy" ON order_items FOR SELECT TO authenticated USING (true);

-- Create indexes for performance
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_portfolio_holdings_user_id ON portfolio_holdings(user_id);
CREATE INDEX idx_portfolio_holdings_symbol ON portfolio_holdings(symbol);
CREATE INDEX idx_portfolio_holdings_user_id_symbol ON portfolio_holdings(user_id, symbol);
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_symbol ON trades(symbol);
CREATE INDEX idx_trades_created_at ON trades(created_at);
CREATE INDEX idx_assets_symbol ON assets(symbol);
CREATE INDEX idx_assets_type ON assets(type);
CREATE INDEX idx_watchlists_user_id ON watchlists(user_id);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX idx_positions_user_id ON positions(user_id);
CREATE INDEX idx_positions_symbol ON positions(symbol);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_timestamp ON transactions(timestamp);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_symbol ON alerts(symbol);

-- Create triggers
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_holdings_updated_at
    BEFORE UPDATE ON portfolio_holdings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trades_updated_at
    BEFORE UPDATE ON trades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample market data
INSERT INTO assets (symbol, name, type, price, change, change_percent, volume, market_cap) VALUES
-- Major US Stocks
('AAPL', 'Apple Inc.', 'stock', 178.25, 2.45, 1.39, 45678900, 2800000000000),
('MSFT', 'Microsoft Corporation', 'stock', 341.87, 4.12, 1.22, 34567890, 2500000000000),
('GOOGL', 'Alphabet Inc. Class A', 'stock', 138.42, -1.23, -0.88, 23456789, 1700000000000),
('AMZN', 'Amazon.com Inc.', 'stock', 145.86, 3.21, 2.25, 56789012, 1500000000000),
('NVDA', 'NVIDIA Corporation', 'stock', 875.21, 15.67, 1.82, 67890123, 2100000000000),
('TSLA', 'Tesla Inc.', 'stock', 189.34, -8.76, -4.42, 78901234, 600000000000),
('META', 'Meta Platforms Inc.', 'stock', 320.45, -2.15, -0.67, 34567890, 850000000000),
('NFLX', 'Netflix Inc.', 'stock', 445.67, 12.34, 2.85, 12345678, 200000000000),

-- Major Forex Pairs
('EURUSD', 'Euro / US Dollar', 'forex', 1.0856, 0.0023, 0.21, 0, 0),
('GBPUSD', 'British Pound / US Dollar', 'forex', 1.2734, 0.0045, 0.35, 0, 0),
('USDJPY', 'US Dollar / Japanese Yen', 'forex', 149.23, 0.67, 0.45, 0, 0),

-- Major Commodities
('GOLD', 'Gold Spot', 'commodity', 2034.56, 12.34, 0.61, 0, 0),
('SILVER', 'Silver Spot', 'commodity', 24.67, 0.45, 1.86, 0, 0),
('CRUDE_OIL', 'Crude Oil WTI', 'commodity', 78.90, 1.45, 1.87, 0, 0),

-- Major Cryptocurrencies
('BTC', 'Bitcoin', 'crypto', 43567.89, 1234.56, 2.92, 0, 850000000000),
('ETH', 'Ethereum', 'crypto', 2345.67, 89.12, 3.95, 0, 280000000000),

-- Major Bonds
('US10Y', 'US 10-Year Treasury', 'bond', 4.567, 0.023, 0.51, 0, 0),
('US30Y', 'US 30-Year Treasury', 'bond', 4.789, 0.034, 0.72, 0, 0)

ON CONFLICT (symbol) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    change = EXCLUDED.change,
    change_percent = EXCLUDED.change_percent,
    volume = EXCLUDED.volume,
    market_cap = EXCLUDED.market_cap,
    last_updated = now();