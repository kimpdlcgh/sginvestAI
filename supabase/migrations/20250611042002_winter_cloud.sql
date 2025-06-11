-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop all existing policies to avoid conflicts
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on all tables to ensure clean slate
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore any errors during cleanup
        NULL;
END $$;

-- Assets table
CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text UNIQUE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['stock'::text, 'forex'::text, 'commodity'::text, 'bond'::text, 'crypto'::text])),
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

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assets_read_policy" ON assets
  FOR SELECT TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_assets_symbol ON assets (symbol);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets (type);

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

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_read_policy" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles (email);

-- Drop existing trigger before creating new one
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  first_name text,
  last_name text,
  phone text,
  date_of_birth date,
  account_type text DEFAULT 'individual' CHECK (account_type = ANY (ARRAY['individual'::text, 'business'::text, 'joint'::text])),
  risk_tolerance text DEFAULT 'moderate' CHECK (risk_tolerance = ANY (ARRAY['conservative'::text, 'moderate'::text, 'aggressive'::text])),
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_profiles_read_policy" ON user_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_profiles_insert_policy" ON user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_profiles_update_policy" ON user_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles (email);

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance numeric(15,2) NOT NULL DEFAULT 0,
  available_balance numeric(15,2) NOT NULL DEFAULT 0,
  pending_balance numeric(15,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'active' CHECK (status = ANY (ARRAY['active'::text, 'suspended'::text, 'frozen'::text])),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet" ON wallets
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets" ON wallets
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() ->> 'email'::text) ~~ '%admin%'::text OR 
    (auth.jwt() ->> 'email'::text) ~~ '%support%'::text
  );

CREATE POLICY "Admins can update wallets" ON wallets
  FOR UPDATE TO authenticated
  USING (
    (auth.jwt() ->> 'email'::text) ~~ '%admin%'::text OR 
    (auth.jwt() ->> 'email'::text) ~~ '%support%'::text
  );

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets (user_id);

DROP TRIGGER IF EXISTS update_wallets_updated_at ON wallets;
CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Wallet transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid REFERENCES wallets(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type = ANY (ARRAY['deposit'::text, 'withdrawal'::text, 'trade_buy'::text, 'trade_sell'::text, 'fee'::text, 'adjustment'::text])),
  amount numeric(15,2) NOT NULL,
  balance_before numeric(15,2) NOT NULL,
  balance_after numeric(15,2) NOT NULL,
  description text,
  reference_id uuid,
  status text NOT NULL DEFAULT 'completed' CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'cancelled'::text])),
  created_at timestamptz DEFAULT now(),
  created_by text
);

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON wallet_transactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wallets 
      WHERE wallets.id = wallet_transactions.wallet_id 
      AND wallets.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all transactions" ON wallet_transactions
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() ->> 'email'::text) ~~ '%admin%'::text OR 
    (auth.jwt() ->> 'email'::text) ~~ '%support%'::text
  );

CREATE POLICY "Admins can insert transactions" ON wallet_transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'email'::text) ~~ '%admin%'::text OR 
    (auth.jwt() ->> 'email'::text) ~~ '%support%'::text
  );

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet_transactions (wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions (created_at);

-- Watchlists table
CREATE TABLE IF NOT EXISTS watchlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  symbols text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  is_default boolean DEFAULT false
);

ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "watchlists_all_policy" ON watchlists
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON watchlists (user_id);

-- Portfolios table
CREATE TABLE IF NOT EXISTS portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'My Portfolio',
  total_value numeric(15,2) DEFAULT 0.00,
  cash_balance numeric(15,2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "portfolios_read_policy" ON portfolios
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "portfolios_all_policy" ON portfolios
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios (user_id);

-- Portfolio holdings table
CREATE TABLE IF NOT EXISTS portfolio_holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

ALTER TABLE portfolio_holdings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "holdings_read_policy" ON portfolio_holdings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "holdings_insert_policy" ON portfolio_holdings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "holdings_update_policy" ON portfolio_holdings
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "holdings_delete_policy" ON portfolio_holdings
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_user_id ON portfolio_holdings (user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_symbol ON portfolio_holdings (symbol);
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_user_id_symbol ON portfolio_holdings (user_id, symbol);

DROP TRIGGER IF EXISTS update_portfolio_holdings_updated_at ON portfolio_holdings;
CREATE TRIGGER update_portfolio_holdings_updated_at
  BEFORE UPDATE ON portfolio_holdings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Positions table
CREATE TABLE IF NOT EXISTS positions (
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

ALTER TABLE positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "positions_read_policy" ON positions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "positions_all_policy" ON positions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_positions_user_id ON positions (user_id);
CREATE INDEX IF NOT EXISTS idx_positions_symbol ON positions (symbol);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id uuid REFERENCES assets(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['buy'::text, 'sell'::text])),
  quantity numeric(15,8) NOT NULL,
  price numeric(15,8) NOT NULL,
  total numeric(15,2) NOT NULL,
  fee numeric(15,2) DEFAULT 0,
  status text DEFAULT 'completed' CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'cancelled'::text])),
  timestamp timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_read_policy" ON transactions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "transactions_insert_policy" ON transactions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions (timestamp);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id uuid REFERENCES assets(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['buy'::text, 'sell'::text])),
  order_type text NOT NULL CHECK (order_type = ANY (ARRAY['market'::text, 'limit'::text, 'stop'::text, 'stop_limit'::text, 'trailing_stop'::text, 'iceberg'::text, 'bracket'::text])),
  quantity numeric(15,8) NOT NULL,
  price numeric(15,8),
  stop_price numeric(15,8),
  trailing_amount numeric(15,8),
  iceberg_qty numeric(15,8),
  time_in_force text DEFAULT 'GTC' CHECK (time_in_force = ANY (ARRAY['GTC'::text, 'IOC'::text, 'FOK'::text, 'DAY'::text])),
  status text DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending'::text, 'filled'::text, 'cancelled'::text, 'partially_filled'::text, 'rejected'::text])),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  fill_price numeric(15,8),
  fill_quantity numeric(15,8)
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_read_policy" ON orders
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "orders_all_policy" ON orders
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['price'::text, 'volume'::text, 'news'::text, 'technical'::text])),
  condition text NOT NULL CHECK (condition = ANY (ARRAY['above'::text, 'below'::text, 'crosses_above'::text, 'crosses_below'::text, 'equals'::text])),
  value numeric(15,8) NOT NULL,
  message text NOT NULL,
  is_active boolean DEFAULT true,
  triggered boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  triggered_at timestamptz
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alerts_read_policy" ON alerts
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "alerts_all_policy" ON alerts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts (user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_symbol ON alerts (symbol);

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['buy'::text, 'sell'::text])),
  order_type text NOT NULL CHECK (order_type = ANY (ARRAY['market'::text, 'limit'::text, 'stop'::text])),
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric NOT NULL CHECK (price > 0),
  total numeric NOT NULL,
  status text DEFAULT 'executed' CHECK (status = ANY (ARRAY['executed'::text, 'pending'::text, 'cancelled'::text])),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trades_read_policy" ON trades
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "trades_insert_policy" ON trades
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trades_update_policy" ON trades
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades (user_id);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades (symbol);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades (created_at);

DROP TRIGGER IF EXISTS update_trades_updated_at ON trades;
CREATE TRIGGER update_trades_updated_at
  BEFORE UPDATE ON trades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Admin orders table
CREATE TABLE IF NOT EXISTS admin_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['buy'::text, 'sell'::text])),
  order_type text NOT NULL CHECK (order_type = ANY (ARRAY['market'::text, 'limit'::text, 'stop'::text])),
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric(15,2) NOT NULL CHECK (price > 0),
  total numeric(15,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending'::text, 'filled'::text, 'cancelled'::text, 'rejected'::text])),
  created_at timestamptz DEFAULT now(),
  filled_at timestamptz,
  created_by text NOT NULL
);

ALTER TABLE admin_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own admin orders" ON admin_orders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all admin orders" ON admin_orders
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() ->> 'email'::text) ~~ '%admin%'::text OR 
    (auth.jwt() ->> 'email'::text) ~~ '%support%'::text
  );

CREATE POLICY "Admins can create admin orders" ON admin_orders
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'email'::text) ~~ '%admin%'::text OR 
    (auth.jwt() ->> 'email'::text) ~~ '%support%'::text
  );

CREATE POLICY "Admins can update admin orders" ON admin_orders
  FOR UPDATE TO authenticated
  USING (
    (auth.jwt() ->> 'email'::text) ~~ '%admin%'::text OR 
    (auth.jwt() ->> 'email'::text) ~~ '%support%'::text
  );

CREATE INDEX IF NOT EXISTS idx_admin_orders_user_id ON admin_orders (user_id);
CREATE INDEX IF NOT EXISTS idx_admin_orders_status ON admin_orders (status);
CREATE INDEX IF NOT EXISTS idx_admin_orders_created_at ON admin_orders (created_at);

-- Create trigger functions for automatic wallet creation
CREATE OR REPLACE FUNCTION create_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wallets (user_id, balance, available_balance, pending_balance)
  VALUES (NEW.id, 0, 0, 0);
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- If wallet already exists, ignore the error
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger functions for default watchlist creation
CREATE OR REPLACE FUNCTION create_default_watchlist()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.watchlists (user_id, name, is_default, symbols)
  VALUES (NEW.id, 'My Watchlist', true, ARRAY['AAPL', 'GOOGL', 'MSFT', 'TSLA']);
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- If watchlist already exists, ignore the error
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for new user setup
DROP TRIGGER IF EXISTS on_auth_user_created_wallet ON auth.users;
CREATE TRIGGER on_auth_user_created_wallet
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_wallet();

DROP TRIGGER IF EXISTS on_auth_user_created_watchlist ON auth.users;
CREATE TRIGGER on_auth_user_created_watchlist
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_watchlist();

-- Insert sample assets data
INSERT INTO assets (symbol, name, type, price, change, change_percent, volume, market_cap) VALUES
  ('AAPL', 'Apple Inc.', 'stock', 175.43, 2.15, 1.24, 45678900, 2800000000000),
  ('GOOGL', 'Alphabet Inc.', 'stock', 2847.52, -15.23, -0.53, 1234567, 1800000000000),
  ('MSFT', 'Microsoft Corporation', 'stock', 378.85, 4.67, 1.25, 23456789, 2900000000000),
  ('TSLA', 'Tesla Inc.', 'stock', 248.42, -8.91, -3.46, 87654321, 800000000000),
  ('AMZN', 'Amazon.com Inc.', 'stock', 3127.45, 12.34, 0.40, 3456789, 1600000000000),
  ('NVDA', 'NVIDIA Corporation', 'stock', 875.28, 23.45, 2.76, 45678901, 2200000000000),
  ('META', 'Meta Platforms Inc.', 'stock', 487.32, -5.67, -1.15, 12345678, 1200000000000),
  ('NFLX', 'Netflix Inc.', 'stock', 542.18, 8.92, 1.67, 5678901, 240000000000),
  ('EURUSD', 'Euro/US Dollar', 'forex', 1.0845, 0.0023, 0.21, 0, 0),
  ('GBPUSD', 'British Pound/US Dollar', 'forex', 1.2634, -0.0045, -0.35, 0, 0),
  ('USDJPY', 'US Dollar/Japanese Yen', 'forex', 149.82, 0.67, 0.45, 0, 0),
  ('BTCUSD', 'Bitcoin', 'crypto', 43250.75, 1250.30, 2.98, 0, 850000000000),
  ('ETHUSD', 'Ethereum', 'crypto', 2650.42, -85.23, -3.11, 0, 320000000000),
  ('XAUUSD', 'Gold', 'commodity', 2045.67, 12.45, 0.61, 0, 0),
  ('CRUDE', 'Crude Oil', 'commodity', 78.92, -1.23, -1.53, 0, 0)
ON CONFLICT (symbol) DO UPDATE SET
  price = EXCLUDED.price,
  change = EXCLUDED.change,
  change_percent = EXCLUDED.change_percent,
  volume = EXCLUDED.volume,
  market_cap = EXCLUDED.market_cap,
  last_updated = now();