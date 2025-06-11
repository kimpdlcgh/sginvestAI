-- Fix duplicate policy error by properly dropping ALL existing policies
-- This migration ensures no policy conflicts exist

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Comprehensive policy cleanup - drop ALL possible existing policies
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

-- Additional specific policy drops to be extra safe
DO $$
BEGIN
    -- Assets policies
    DROP POLICY IF EXISTS "Anyone can read assets" ON assets;
    DROP POLICY IF EXISTS "Assets read policy" ON assets;
    
    -- Watchlists policies
    DROP POLICY IF EXISTS "Users can manage own watchlists" ON watchlists;
    DROP POLICY IF EXISTS "Watchlists policy" ON watchlists;
    
    -- Profiles policies (multiple possible names)
    DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
    DROP POLICY IF EXISTS "Profiles read policy" ON profiles;
    DROP POLICY IF EXISTS "Profiles update policy" ON profiles;
    DROP POLICY IF EXISTS "Profiles insert policy" ON profiles;
    
    -- User profiles policies
    DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
    DROP POLICY IF EXISTS "User profiles read policy" ON user_profiles;
    DROP POLICY IF EXISTS "User profiles update policy" ON user_profiles;
    DROP POLICY IF EXISTS "User profiles insert policy" ON user_profiles;
    
    -- Portfolio policies
    DROP POLICY IF EXISTS "Users can read own portfolios" ON portfolios;
    DROP POLICY IF EXISTS "Users can manage own portfolios" ON portfolios;
    
    -- Portfolio holdings policies
    DROP POLICY IF EXISTS "Users can read own holdings" ON portfolio_holdings;
    DROP POLICY IF EXISTS "Users can insert own holdings" ON portfolio_holdings;
    DROP POLICY IF EXISTS "Users can update own holdings" ON portfolio_holdings;
    DROP POLICY IF EXISTS "Users can delete own holdings" ON portfolio_holdings;
    
    -- Trades policies
    DROP POLICY IF EXISTS "Users can read own trades" ON trades;
    DROP POLICY IF EXISTS "Users can insert own trades" ON trades;
    DROP POLICY IF EXISTS "Users can update own trades" ON trades;
    
    -- All other table policies
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
    DROP POLICY IF EXISTS "Anyone can read reviews" ON reviews;
    DROP POLICY IF EXISTS "Users can read own messages" ON messages;
    DROP POLICY IF EXISTS "Users can send messages" ON messages;
    DROP POLICY IF EXISTS "Users can update own messages" ON messages;
    DROP POLICY IF EXISTS "Users can read order items" ON order_items;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors if policies don't exist
        NULL;
END $$;

-- Now create all policies with unique names using auth.uid()
-- Assets (public read)
CREATE POLICY "assets_read_policy" ON assets FOR SELECT TO authenticated USING (true);

-- Watchlists
CREATE POLICY "watchlists_all_policy" ON watchlists FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Profiles (using unique names)
CREATE POLICY "profiles_read_policy" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_update_policy" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_policy" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- User profiles (using different names to avoid conflicts)
CREATE POLICY "user_profiles_read_policy" ON user_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_profiles_update_policy" ON user_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_profiles_insert_policy" ON user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Portfolios
CREATE POLICY "portfolios_read_policy" ON portfolios FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "portfolios_all_policy" ON portfolios FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Portfolio holdings
CREATE POLICY "holdings_read_policy" ON portfolio_holdings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "holdings_insert_policy" ON portfolio_holdings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "holdings_update_policy" ON portfolio_holdings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "holdings_delete_policy" ON portfolio_holdings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Trades
CREATE POLICY "trades_read_policy" ON trades FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "trades_insert_policy" ON trades FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "trades_update_policy" ON trades FOR UPDATE TO authenticated USING (auth.uid() = user_id);

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

-- Reviews policies
CREATE POLICY "reviews_read_policy" ON reviews FOR SELECT TO public USING (true);

-- Messages policies  
CREATE POLICY "messages_read_policy" ON messages FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "messages_insert_policy" ON messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "messages_update_policy" ON messages FOR UPDATE TO authenticated USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Order items policies
CREATE POLICY "order_items_read_policy" ON order_items FOR SELECT TO authenticated USING (true);