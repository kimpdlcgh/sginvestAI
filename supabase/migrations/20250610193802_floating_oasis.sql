-- Fix uid() function error by using auth.uid() instead
-- This migration fixes the RLS policies to use the correct Supabase auth function

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop ALL existing policies to recreate them with correct function
DO $$
BEGIN
    -- Drop all existing policies to recreate them with correct function
    DROP POLICY IF EXISTS "Anyone can read assets" ON assets;
    DROP POLICY IF EXISTS "Users can manage own watchlists" ON watchlists;
    DROP POLICY IF EXISTS "Users can read own watchlists" ON watchlists;
    DROP POLICY IF EXISTS "Users can read own watchlist" ON watchlists;
    DROP POLICY IF EXISTS "Users can insert own watchlist" ON watchlists;
    DROP POLICY IF EXISTS "Users can delete own watchlist" ON watchlists;
    DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Users can read own portfolios" ON portfolios;
    DROP POLICY IF EXISTS "Users can manage own portfolios" ON portfolios;
    DROP POLICY IF EXISTS "Users can read own holdings" ON portfolio_holdings;
    DROP POLICY IF EXISTS "Users can insert own holdings" ON portfolio_holdings;
    DROP POLICY IF EXISTS "Users can update own holdings" ON portfolio_holdings;
    DROP POLICY IF EXISTS "Users can delete own holdings" ON portfolio_holdings;
    DROP POLICY IF EXISTS "Users can read own trades" ON trades;
    DROP POLICY IF EXISTS "Users can insert own trades" ON trades;
    DROP POLICY IF EXISTS "Users can update own trades" ON trades;
    DROP POLICY IF EXISTS "Users can read own positions" ON positions;
    DROP POLICY IF EXISTS "Users can manage own positions" ON positions;
    DROP POLICY IF EXISTS "Users can read own transactions" ON transactions;
    DROP POLICY IF EXISTS "Users can create own transactions" ON transactions;
    DROP POLICY IF EXISTS "Users can read own orders" ON orders;
    DROP POLICY IF EXISTS "Users can manage own orders" ON orders;
    DROP POLICY IF EXISTS "Users can read own alerts" ON alerts;
    DROP POLICY IF EXISTS "Users can manage own alerts" ON alerts;
    DROP POLICY IF EXISTS "Users can view all farms" ON farms;
    DROP POLICY IF EXISTS "Users can update their own farm" ON farms;
    DROP POLICY IF EXISTS "Users can insert their own farm" ON farms;
    DROP POLICY IF EXISTS "Users can view all products" ON products;
    DROP POLICY IF EXISTS "Sellers can update their own products" ON products;
    DROP POLICY IF EXISTS "Sellers can insert their own products" ON products;
    DROP POLICY IF EXISTS "Users can read own data" ON users;
    DROP POLICY IF EXISTS "Users can update own data" ON users;
    DROP POLICY IF EXISTS "Allow authenticated users to create their own profile" ON users;
    DROP POLICY IF EXISTS "Allow authenticated users to update their own profile" ON users;
    DROP POLICY IF EXISTS "Allow authenticated users to view their own profile" ON users;
    DROP POLICY IF EXISTS "Allow public signup" ON users;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors if policies don't exist
        NULL;
END $$;

-- Create RLS policies with correct auth.uid() function
-- Assets (public read)
CREATE POLICY "Anyone can read assets" ON assets FOR SELECT TO authenticated USING (true);

-- Watchlists
CREATE POLICY "Users can manage own watchlists" ON watchlists FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Profiles
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- User profiles (use different policy names to avoid conflicts)
CREATE POLICY "Users can read own user profile" ON user_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own user profile" ON user_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own user profile" ON user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Portfolios
CREATE POLICY "Users can read own portfolios" ON portfolios FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own portfolios" ON portfolios FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Portfolio holdings
CREATE POLICY "Users can read own holdings" ON portfolio_holdings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own holdings" ON portfolio_holdings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own holdings" ON portfolio_holdings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own holdings" ON portfolio_holdings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Trades
CREATE POLICY "Users can read own trades" ON trades FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trades" ON trades FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trades" ON trades FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Positions
CREATE POLICY "Users can read own positions" ON positions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own positions" ON positions FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Transactions
CREATE POLICY "Users can read own transactions" ON transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own transactions" ON transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Orders
CREATE POLICY "Users can read own orders" ON orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own orders" ON orders FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Alerts
CREATE POLICY "Users can read own alerts" ON alerts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own alerts" ON alerts FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Farms
CREATE POLICY "Users can view all farms" ON farms FOR SELECT TO public USING (true);
CREATE POLICY "Users can update their own farm" ON farms FOR UPDATE TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own farm" ON farms FOR INSERT TO public WITH CHECK (auth.uid() = user_id);

-- Products
CREATE POLICY "Users can view all products" ON products FOR SELECT TO public USING (true);
CREATE POLICY "Sellers can update their own products" ON products FOR UPDATE TO public USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = products.farm_id AND farms.user_id = auth.uid()));
CREATE POLICY "Sellers can insert their own products" ON products FOR INSERT TO public WITH CHECK (EXISTS (SELECT 1 FROM farms WHERE farms.id = products.farm_id AND farms.user_id = auth.uid()));

-- Reviews policies
CREATE POLICY "Anyone can read reviews" ON reviews FOR SELECT TO public USING (true);

-- Messages policies  
CREATE POLICY "Users can read own messages" ON messages FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Users can send messages" ON messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update own messages" ON messages FOR UPDATE TO authenticated USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Order items policies
CREATE POLICY "Users can read order items" ON order_items FOR SELECT TO authenticated USING (true);