/*
  # Complete Database Schema Migration

  1. New Tables
    - `profiles` - User profile information and settings
    - `user_profiles` - Extended user profile data
    - `assets` - Market asset information
    - `watchlists` - User watchlists for tracking securities
    - `portfolios` - User portfolio management
    - `portfolio_holdings` - Individual asset holdings
    - `positions` - Trading positions
    - `trades` - Trade history and orders
    - `transactions` - Transaction records
    - `orders` - Trading orders
    - `alerts` - Price and market alerts
    - `wallets` - User wallet management
    - `wallet_transactions` - Wallet transaction history
    - `admin_orders` - Admin-created orders
    - `funding_requests` - User funding requests

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Add admin policies for management functions

  3. Triggers
    - Automatic profile creation on user signup
    - Default watchlist and wallet creation
    - Updated_at timestamp triggers
*/

-- Create update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create update_funding_requests_updated_at function
CREATE OR REPLACE FUNCTION update_funding_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create profiles table (essential for user signup)
CREATE TABLE IF NOT EXISTS profiles (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
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

-- Create indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and create new ones for profiles
DROP POLICY IF EXISTS "profiles_read_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

CREATE POLICY "profiles_read_policy" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_policy" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Create trigger for profiles updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- Create indexes for user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and create new ones for user_profiles
DROP POLICY IF EXISTS "user_profiles_read_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_policy" ON user_profiles;

CREATE POLICY "user_profiles_read_policy" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_profiles_insert_policy" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_profiles_update_policy" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger for user_profiles updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create assets table
CREATE TABLE IF NOT EXISTS assets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- Create indexes for assets
CREATE INDEX IF NOT EXISTS idx_assets_symbol ON assets(symbol);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);

-- Enable RLS on assets
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and create new ones for assets
DROP POLICY IF EXISTS "assets_read_policy" ON assets;

CREATE POLICY "assets_read_policy" ON assets
    FOR SELECT TO authenticated USING (true);

-- Create watchlists table
CREATE TABLE IF NOT EXISTS watchlists (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    symbols text[] DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    is_default boolean DEFAULT false
);

-- Create indexes for watchlists
CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON watchlists(user_id);

-- Enable RLS on watchlists
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and create new ones for watchlists
DROP POLICY IF EXISTS "watchlists_all_policy" ON watchlists;

CREATE POLICY "watchlists_all_policy" ON watchlists
    FOR ALL USING (auth.uid() = user_id);

-- Create portfolios table
CREATE TABLE IF NOT EXISTS portfolios (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL DEFAULT 'My Portfolio',
    total_value numeric(15,2) DEFAULT 0.00,
    cash_balance numeric(15,2) DEFAULT 0.00,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes for portfolios
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);

-- Enable RLS on portfolios
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and create new ones for portfolios
DROP POLICY IF EXISTS "portfolios_read_policy" ON portfolios;
DROP POLICY IF EXISTS "portfolios_all_policy" ON portfolios;

CREATE POLICY "portfolios_read_policy" ON portfolios
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "portfolios_all_policy" ON portfolios
    FOR ALL USING (auth.uid() = user_id);

-- Create portfolio_holdings table
CREATE TABLE IF NOT EXISTS portfolio_holdings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol text NOT NULL,
    name text NOT NULL,
    shares numeric DEFAULT 0,
    average_price numeric DEFAULT 0,
    current_price numeric DEFAULT 0,
    sector text DEFAULT 'Technology',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, symbol)
);

-- Create indexes for portfolio_holdings
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_user_id ON portfolio_holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_symbol ON portfolio_holdings(symbol);
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_user_id_symbol ON portfolio_holdings(user_id, symbol);

-- Enable RLS on portfolio_holdings
ALTER TABLE portfolio_holdings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and create new ones for portfolio_holdings
DROP POLICY IF EXISTS "holdings_read_policy" ON portfolio_holdings;
DROP POLICY IF EXISTS "holdings_insert_policy" ON portfolio_holdings;
DROP POLICY IF EXISTS "holdings_update_policy" ON portfolio_holdings;
DROP POLICY IF EXISTS "holdings_delete_policy" ON portfolio_holdings;

CREATE POLICY "holdings_read_policy" ON portfolio_holdings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "holdings_insert_policy" ON portfolio_holdings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "holdings_update_policy" ON portfolio_holdings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "holdings_delete_policy" ON portfolio_holdings
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for portfolio_holdings updated_at
DROP TRIGGER IF EXISTS update_portfolio_holdings_updated_at ON portfolio_holdings;
CREATE TRIGGER update_portfolio_holdings_updated_at
    BEFORE UPDATE ON portfolio_holdings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create positions table
CREATE TABLE IF NOT EXISTS positions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- Create indexes for positions
CREATE INDEX IF NOT EXISTS idx_positions_user_id ON positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_symbol ON positions(symbol);

-- Enable RLS on positions
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and create new ones for positions
DROP POLICY IF EXISTS "positions_read_policy" ON positions;
DROP POLICY IF EXISTS "positions_all_policy" ON positions;

CREATE POLICY "positions_read_policy" ON positions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "positions_all_policy" ON positions
    FOR ALL USING (auth.uid() = user_id);

-- Create trades table (essential for trade functionality)
CREATE TABLE IF NOT EXISTS trades (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- Create indexes for trades
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades(created_at);

-- Enable RLS on trades
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and create new ones for trades
DROP POLICY IF EXISTS "trades_read_policy" ON trades;
DROP POLICY IF EXISTS "trades_insert_policy" ON trades;
DROP POLICY IF EXISTS "trades_update_policy" ON trades;

CREATE POLICY "trades_read_policy" ON trades
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "trades_insert_policy" ON trades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trades_update_policy" ON trades
    FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger for trades updated_at
DROP TRIGGER IF EXISTS update_trades_updated_at ON trades;
CREATE TRIGGER update_trades_updated_at
    BEFORE UPDATE ON trades
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- Create indexes for transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp);

-- Enable RLS on transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and create new ones for transactions
DROP POLICY IF EXISTS "transactions_read_policy" ON transactions;
DROP POLICY IF EXISTS "transactions_insert_policy" ON transactions;

CREATE POLICY "transactions_read_policy" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "transactions_insert_policy" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- Create indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Enable RLS on orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and create new ones for orders
DROP POLICY IF EXISTS "orders_read_policy" ON orders;
DROP POLICY IF EXISTS "orders_all_policy" ON orders;

CREATE POLICY "orders_read_policy" ON orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "orders_all_policy" ON orders
    FOR ALL USING (auth.uid() = user_id);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol text NOT NULL,
    type text NOT NULL CHECK (type IN ('price', 'volume', 'news', 'technical')),
    condition text NOT NULL CHECK (condition IN ('above', 'below', 'crosses_above', 'crosses_below', 'equals')),
    value numeric(15,8) NOT NULL,
    message text NOT NULL,
    is_active boolean DEFAULT true,
    triggered boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    triggered_at timestamptz
);

-- Create indexes for alerts
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_symbol ON alerts(symbol);

-- Enable RLS on alerts
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and create new ones for alerts
DROP POLICY IF EXISTS "alerts_read_policy" ON alerts;
DROP POLICY IF EXISTS "alerts_all_policy" ON alerts;

CREATE POLICY "alerts_read_policy" ON alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "alerts_all_policy" ON alerts
    FOR ALL USING (auth.uid() = user_id);

-- Create wallets table
CREATE TABLE IF NOT EXISTS wallets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    balance numeric(15,2) NOT NULL DEFAULT 0,
    available_balance numeric(15,2) NOT NULL DEFAULT 0,
    pending_balance numeric(15,2) NOT NULL DEFAULT 0,
    currency text NOT NULL DEFAULT 'USD',
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'frozen')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes for wallets
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);

-- Enable RLS on wallets
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and create new ones for wallets
DROP POLICY IF EXISTS "Users can view own wallet" ON wallets;
DROP POLICY IF EXISTS "Admins can view all wallets" ON wallets;
DROP POLICY IF EXISTS "Admins can update wallets" ON wallets;

CREATE POLICY "Users can view own wallet" ON wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets" ON wallets
    FOR SELECT USING (
        (auth.jwt() ->> 'email') LIKE '%admin%' OR 
        (auth.jwt() ->> 'email') LIKE '%support%'
    );

CREATE POLICY "Admins can update wallets" ON wallets
    FOR UPDATE USING (
        (auth.jwt() ->> 'email') LIKE '%admin%' OR 
        (auth.jwt() ->> 'email') LIKE '%support%'
    );

-- Create trigger for wallets updated_at
DROP TRIGGER IF EXISTS update_wallets_updated_at ON wallets;
CREATE TRIGGER update_wallets_updated_at
    BEFORE UPDATE ON wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create wallet_transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_id uuid REFERENCES wallets(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'trade_buy', 'trade_sell', 'fee', 'adjustment')),
    amount numeric(15,2) NOT NULL,
    balance_before numeric(15,2) NOT NULL,
    balance_after numeric(15,2) NOT NULL,
    description text,
    reference_id uuid,
    status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    created_at timestamptz DEFAULT now(),
    created_by text
);

-- Create indexes for wallet_transactions
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at);

-- Enable RLS on wallet_transactions
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and create new ones for wallet_transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON wallet_transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON wallet_transactions;
DROP POLICY IF EXISTS "Admins can insert transactions" ON wallet_transactions;

CREATE POLICY "Users can view own transactions" ON wallet_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM wallets 
            WHERE wallets.id = wallet_transactions.wallet_id 
            AND wallets.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all transactions" ON wallet_transactions
    FOR SELECT USING (
        (auth.jwt() ->> 'email') LIKE '%admin%' OR 
        (auth.jwt() ->> 'email') LIKE '%support%'
    );

CREATE POLICY "Admins can insert transactions" ON wallet_transactions
    FOR INSERT WITH CHECK (
        (auth.jwt() ->> 'email') LIKE '%admin%' OR 
        (auth.jwt() ->> 'email') LIKE '%support%'
    );

-- Create admin_orders table
CREATE TABLE IF NOT EXISTS admin_orders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol text NOT NULL,
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('buy', 'sell')),
    order_type text NOT NULL CHECK (order_type IN ('market', 'limit', 'stop')),
    quantity integer NOT NULL CHECK (quantity > 0),
    price numeric(15,2) NOT NULL CHECK (price > 0),
    total numeric(15,2) NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'cancelled', 'rejected')),
    created_at timestamptz DEFAULT now(),
    filled_at timestamptz,
    created_by text NOT NULL
);

-- Create indexes for admin_orders
CREATE INDEX IF NOT EXISTS idx_admin_orders_user_id ON admin_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_orders_status ON admin_orders(status);
CREATE INDEX IF NOT EXISTS idx_admin_orders_created_at ON admin_orders(created_at);

-- Enable RLS on admin_orders
ALTER TABLE admin_orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and create new ones for admin_orders
DROP POLICY IF EXISTS "Users can view own admin orders" ON admin_orders;
DROP POLICY IF EXISTS "Admins can view all admin orders" ON admin_orders;
DROP POLICY IF EXISTS "Admins can create admin orders" ON admin_orders;
DROP POLICY IF EXISTS "Admins can update admin orders" ON admin_orders;

CREATE POLICY "Users can view own admin orders" ON admin_orders
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all admin orders" ON admin_orders
    FOR SELECT USING (
        (auth.jwt() ->> 'email') LIKE '%admin%' OR 
        (auth.jwt() ->> 'email') LIKE '%support%'
    );

CREATE POLICY "Admins can create admin orders" ON admin_orders
    FOR INSERT WITH CHECK (
        (auth.jwt() ->> 'email') LIKE '%admin%' OR 
        (auth.jwt() ->> 'email') LIKE '%support%'
    );

CREATE POLICY "Admins can update admin orders" ON admin_orders
    FOR UPDATE USING (
        (auth.jwt() ->> 'email') LIKE '%admin%' OR 
        (auth.jwt() ->> 'email') LIKE '%support%'
    );

-- Create funding_requests table
CREATE TABLE IF NOT EXISTS funding_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email text NOT NULL,
    requested_amount numeric(15,2) NOT NULL CHECK (requested_amount > 0),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    message text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes for funding_requests
CREATE INDEX IF NOT EXISTS idx_funding_requests_user_id ON funding_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_funding_requests_status ON funding_requests(status);
CREATE INDEX IF NOT EXISTS idx_funding_requests_created_at ON funding_requests(created_at);

-- Enable RLS on funding_requests
ALTER TABLE funding_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and create new ones for funding_requests
DROP POLICY IF EXISTS "Users can view their own funding requests" ON funding_requests;
DROP POLICY IF EXISTS "Users can insert their own funding requests" ON funding_requests;
DROP POLICY IF EXISTS "Admins can view all funding requests" ON funding_requests;
DROP POLICY IF EXISTS "Admins can update funding requests" ON funding_requests;

CREATE POLICY "Users can view their own funding requests" ON funding_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own funding requests" ON funding_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all funding requests" ON funding_requests
    FOR SELECT USING (
        (auth.jwt() ->> 'email') LIKE '%admin%' OR 
        (auth.jwt() ->> 'email') LIKE '%support%'
    );

CREATE POLICY "Admins can update funding requests" ON funding_requests
    FOR UPDATE USING (
        (auth.jwt() ->> 'email') LIKE '%admin%' OR 
        (auth.jwt() ->> 'email') LIKE '%support%'
    );

-- Create trigger for funding_requests updated_at
DROP TRIGGER IF EXISTS update_funding_requests_updated_at ON funding_requests;
CREATE TRIGGER update_funding_requests_updated_at
    BEFORE UPDATE ON funding_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_funding_requests_updated_at();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into profiles table
    INSERT INTO public.profiles (id, email, created_at, updated_at)
    VALUES (NEW.id, NEW.email, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    
    -- Insert into user_profiles table
    INSERT INTO public.user_profiles (user_id, email, created_at, updated_at)
    VALUES (NEW.id, NEW.email, NOW(), NOW())
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create default watchlist
CREATE OR REPLACE FUNCTION create_default_watchlist()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.watchlists (user_id, name, is_default, created_at)
    VALUES (NEW.id, 'My Watchlist', true, NOW())
    ON CONFLICT DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create user wallet
CREATE OR REPLACE FUNCTION create_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.wallets (user_id, balance, available_balance, pending_balance, created_at, updated_at)
    VALUES (NEW.id, 0, 0, 0, NOW(), NOW())
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_created_watchlist ON auth.users;
CREATE TRIGGER on_auth_user_created_watchlist
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_default_watchlist();

DROP TRIGGER IF EXISTS on_auth_user_created_wallet ON auth.users;
CREATE TRIGGER on_auth_user_created_wallet
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_wallet();

-- Insert some sample assets for testing
INSERT INTO assets (symbol, name, type, price, change, change_percent, volume, market_cap) VALUES
('AAPL', 'Apple Inc.', 'stock', 150.25, 2.15, 1.45, 50000000, 2500000000000),
('GOOGL', 'Alphabet Inc.', 'stock', 2750.80, -15.20, -0.55, 25000000, 1800000000000),
('MSFT', 'Microsoft Corporation', 'stock', 305.50, 5.75, 1.92, 35000000, 2300000000000),
('TSLA', 'Tesla Inc.', 'stock', 245.30, -8.45, -3.33, 45000000, 780000000000),
('AMZN', 'Amazon.com Inc.', 'stock', 3200.15, 25.80, 0.81, 20000000, 1600000000000),
('NVDA', 'NVIDIA Corporation', 'stock', 420.75, 12.30, 3.01, 40000000, 1040000000000),
('META', 'Meta Platforms Inc.', 'stock', 285.90, -3.25, -1.12, 30000000, 770000000000),
('BTC-USD', 'Bitcoin', 'crypto', 45250.75, 1250.30, 2.84, 15000000, 890000000000),
('ETH-USD', 'Ethereum', 'crypto', 3150.25, -85.40, -2.64, 12000000, 380000000000),
('EUR/USD', 'Euro to US Dollar', 'forex', 1.0875, 0.0025, 0.23, 0, 0)
ON CONFLICT (symbol) DO UPDATE SET
    price = EXCLUDED.price,
    change = EXCLUDED.change,
    change_percent = EXCLUDED.change_percent,
    volume = EXCLUDED.volume,
    market_cap = EXCLUDED.market_cap,
    last_updated = NOW();