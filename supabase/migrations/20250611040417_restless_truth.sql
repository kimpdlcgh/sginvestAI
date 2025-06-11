/*
  # Wallet System and Admin Management Schema

  1. New Tables
    - `wallets` - User wallet for managing funds
    - `wallet_transactions` - Transaction history for wallets
    - `admin_orders` - Orders created by admins for users

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users and admins

  3. Features
    - Wallet balance tracking
    - Transaction history
    - Admin order management
*/

-- Create wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance numeric(15,2) NOT NULL DEFAULT 0,
  available_balance numeric(15,2) NOT NULL DEFAULT 0,
  pending_balance numeric(15,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'frozen')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create wallet_transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Create admin_orders table
CREATE TABLE IF NOT EXISTS admin_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Enable RLS on all tables
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for wallets
CREATE POLICY "Users can view own wallet" ON wallets
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets" ON wallets
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%admin%' OR auth.jwt() ->> 'email' LIKE '%support%');

CREATE POLICY "Admins can update wallets" ON wallets
  FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%admin%' OR auth.jwt() ->> 'email' LIKE '%support%');

-- Create RLS policies for wallet_transactions
CREATE POLICY "Users can view own transactions" ON wallet_transactions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM wallets
    WHERE wallets.id = wallet_transactions.wallet_id
    AND wallets.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all transactions" ON wallet_transactions
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%admin%' OR auth.jwt() ->> 'email' LIKE '%support%');

CREATE POLICY "Admins can insert transactions" ON wallet_transactions
  FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' LIKE '%admin%' OR auth.jwt() ->> 'email' LIKE '%support%');

-- Create RLS policies for admin_orders
CREATE POLICY "Users can view own admin orders" ON admin_orders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all admin orders" ON admin_orders
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%admin%' OR auth.jwt() ->> 'email' LIKE '%support%');

CREATE POLICY "Admins can create admin orders" ON admin_orders
  FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' LIKE '%admin%' OR auth.jwt() ->> 'email' LIKE '%support%');

CREATE POLICY "Admins can update admin orders" ON admin_orders
  FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%admin%' OR auth.jwt() ->> 'email' LIKE '%support%');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_orders_user_id ON admin_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_orders_status ON admin_orders(status);
CREATE INDEX IF NOT EXISTS idx_admin_orders_created_at ON admin_orders(created_at);

-- Create triggers for updated_at
CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to create wallet on user creation
CREATE OR REPLACE FUNCTION create_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (user_id, balance, available_balance)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error creating wallet for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for wallet creation
DROP TRIGGER IF EXISTS on_user_created_create_wallet ON auth.users;
CREATE TRIGGER on_user_created_create_wallet
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_wallet();