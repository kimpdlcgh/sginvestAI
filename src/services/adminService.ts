import { supabase } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { User, AdminOrder, AdminStats, UserStats, FundingRequest } from '../types/admin';
import { walletService } from './walletService';
import { marketDataService } from './marketData';

// Create admin client with service role key for elevated privileges
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin: any = null;

if (supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export class AdminService {
  async getAllUsers(limit: number = 50, offset: number = 0): Promise<User[]> {
    try {
      if (!supabaseAdmin) {
        console.warn('Admin service not available - service role key not configured');
        return [];
      }

      // Get users from auth.users using admin client
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers({
        page: Math.floor(offset / limit) + 1,
        perPage: limit
      });

      if (authError) throw authError;

      // Get profiles and wallets for these users
      const userIds = authUsers.users.map(u => u.id);
      
      const [profilesResult, walletsResult] = await Promise.all([
        supabase.from('profiles').select('*').in('id', userIds),
        supabase.from('wallets').select('*').in('user_id', userIds)
      ]);

      const profiles = profilesResult.data || [];
      const wallets = walletsResult.data || [];

      // Combine data
      const users: User[] = authUsers.users.map(authUser => ({
        id: authUser.id,
        email: authUser.email || '',
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at,
        email_confirmed_at: authUser.email_confirmed_at,
        profile: profiles.find(p => p.id === authUser.id),
        wallet: wallets.find(w => w.user_id === authUser.id)
      }));

      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      if (!supabaseAdmin) {
        console.warn('Admin service not available - service role key not configured');
        return null;
      }

      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (authError) throw authError;

      const [profileResult, walletResult, statsResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('wallets').select('*').eq('user_id', userId).single(),
        this.getUserStats(userId)
      ]);

      return {
        id: authUser.user.id,
        email: authUser.user.email || '',
        created_at: authUser.user.created_at,
        last_sign_in_at: authUser.user.last_sign_in_at,
        email_confirmed_at: authUser.user.email_confirmed_at,
        profile: profileResult.data,
        wallet: walletResult.data,
        stats: statsResult
      };
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  async createUser(email: string, password: string, initialBalance: number = 0): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      if (!supabaseAdmin) {
        return { 
          success: false, 
          error: 'Admin service not available - service role key not configured' 
        };
      }

      // Create user in auth using admin client
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

      if (authError) throw authError;

      const userId = authData.user.id;

      // Create wallet if initial balance > 0
      if (initialBalance > 0) {
        await walletService.createWallet(userId, initialBalance);
      }

      // Get the complete user data
      const user = await this.getUserById(userId);
      
      return { success: true, user: user || undefined };
    } catch (error) {
      console.error('Error creating user:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async updateUserWallet(
    userId: string, 
    amount: number, 
    type: 'deposit' | 'withdrawal' | 'adjustment',
    description: string,
    adminId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      let wallet = await walletService.getUserWallet(userId);
      
      // Create wallet if it doesn't exist
      if (!wallet) {
        wallet = await walletService.createWallet(userId, 0);
      }

      const result = await walletService.updateWalletBalance(
        wallet.id,
        amount,
        type,
        description,
        adminId
      );

      return result;
    } catch (error) {
      console.error('Error updating user wallet:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async createOrderForUser(
    userId: string,
    order: {
      symbol: string;
      name: string;
      type: 'buy' | 'sell';
      order_type: 'market' | 'limit';
      quantity: number;
      price?: number;
    },
    adminId: string
  ): Promise<{ success: boolean; order?: AdminOrder; error?: string }> {
    try {
      // Get current market price if not provided
      let executionPrice = order.price;
      if (order.order_type === 'market' || !executionPrice) {
        const quote = await marketDataService.getQuote(order.symbol);
        executionPrice = quote.price;
      }

      const total = order.quantity * executionPrice;

      // Check wallet balance for buy orders
      if (order.type === 'buy') {
        const hasFunds = await walletService.checkSufficientFunds(userId, total);
        if (!hasFunds) {
          return { success: false, error: 'Insufficient wallet balance' };
        }
      }

      // Create the order in trades table with pending status
      const { data: tradeData, error: tradeError } = await supabase
        .from('trades')
        .insert({
          user_id: userId,
          symbol: order.symbol,
          name: order.name,
          type: order.type,
          order_type: order.order_type,
          quantity: order.quantity,
          price: executionPrice,
          total,
          status: 'pending'
        })
        .select()
        .single();

      if (tradeError) throw tradeError;

      // Convert trade to AdminOrder format
      const adminOrder: AdminOrder = {
        id: tradeData.id,
        user_id: tradeData.user_id,
        symbol: tradeData.symbol,
        name: tradeData.name,
        type: tradeData.type,
        order_type: tradeData.order_type,
        quantity: tradeData.quantity,
        price: tradeData.price,
        total: tradeData.total,
        status: tradeData.status,
        created_at: tradeData.created_at,
        filled_at: tradeData.updated_at,
        created_by: adminId
      };

      return { success: true, order: adminOrder };
    } catch (error) {
      console.error('Error creating order for user:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async fillOrder(orderId: string, adminId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the order from trades table
      const { data: order, error: orderError } = await supabase
        .from('trades')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      if (order.status !== 'pending') {
        return { success: false, error: 'Order is not pending' };
      }

      // Get user's wallet
      let wallet = await walletService.getUserWallet(order.user_id);
      if (!wallet) {
        wallet = await walletService.createWallet(order.user_id, 0);
      }

      // Process the trade based on type
      if (order.type === 'buy') {
        // Deduct money from wallet
        const walletResult = await walletService.updateWalletBalance(
          wallet.id,
          -order.total,
          'trade_buy',
          `Buy ${order.quantity} shares of ${order.symbol}`,
          adminId,
          orderId
        );

        if (!walletResult.success) {
          return { success: false, error: walletResult.error };
        }

        // Add to portfolio
        await this.addToPortfolio(order.user_id, order.symbol, order.name, order.quantity, order.price);
      } else {
        // Sell order - remove from portfolio and add money to wallet
        const removeResult = await this.removeFromPortfolio(order.user_id, order.symbol, order.quantity);
        if (!removeResult.success) {
          return { success: false, error: removeResult.error };
        }

        await walletService.updateWalletBalance(
          wallet.id,
          order.total,
          'trade_sell',
          `Sell ${order.quantity} shares of ${order.symbol}`,
          adminId,
          orderId
        );
      }

      // Update order status to executed
      await supabase
        .from('trades')
        .update({
          status: 'executed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      return { success: true };
    } catch (error) {
      console.error('Error filling order:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private async addToPortfolio(userId: string, symbol: string, name: string, quantity: number, price: number): Promise<void> {
    const { data: existing } = await supabase
      .from('portfolio_holdings')
      .select('*')
      .eq('user_id', userId)
      .eq('symbol', symbol)
      .single();

    if (existing) {
      // Update existing holding
      const newQuantity = existing.shares + quantity;
      const newAveragePrice = ((existing.shares * existing.average_price) + (quantity * price)) / newQuantity;

      await supabase
        .from('portfolio_holdings')
        .update({
          shares: newQuantity,
          average_price: newAveragePrice,
          current_price: price,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      // Create new holding
      await supabase
        .from('portfolio_holdings')
        .insert({
          user_id: userId,
          symbol,
          name,
          shares: quantity,
          average_price: price,
          current_price: price,
          sector: 'Technology' // Default sector
        });
    }
  }

  private async removeFromPortfolio(userId: string, symbol: string, quantity: number): Promise<{ success: boolean; error?: string }> {
    const { data: existing } = await supabase
      .from('portfolio_holdings')
      .select('*')
      .eq('user_id', userId)
      .eq('symbol', symbol)
      .single();

    if (!existing) {
      return { success: false, error: 'Position not found' };
    }

    if (existing.shares < quantity) {
      return { success: false, error: 'Insufficient shares' };
    }

    if (existing.shares === quantity) {
      // Remove entire position
      await supabase
        .from('portfolio_holdings')
        .delete()
        .eq('id', existing.id);
    } else {
      // Reduce position
      await supabase
        .from('portfolio_holdings')
        .update({
          shares: existing.shares - quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    }

    return { success: true };
  }

  async getPendingOrders(): Promise<AdminOrder[]> {
    try {
      // Get pending trades
      const { data: trades, error: tradesError } = await supabase
        .from('trades')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (tradesError) throw tradesError;

      if (!trades || trades.length === 0) {
        return [];
      }

      // Get user emails separately
      const userIds = trades.map(trade => trade.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);

      if (profilesError) {
        console.warn('Could not fetch user profiles:', profilesError);
      }

      // Combine data
      const orders: AdminOrder[] = trades.map(trade => ({
        id: trade.id,
        user_id: trade.user_id,
        symbol: trade.symbol,
        name: trade.name,
        type: trade.type,
        order_type: trade.order_type,
        quantity: trade.quantity,
        price: trade.price,
        total: trade.total,
        status: trade.status,
        created_at: trade.created_at,
        filled_at: trade.updated_at,
        created_by: 'admin',
        user_email: profiles?.find(p => p.id === trade.user_id)?.email || 'Unknown'
      }));

      return orders;
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      return [];
    }
  }

  async getPendingFundingRequests(): Promise<{ data: FundingRequest[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('funding_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching funding requests:', error);
      return { data: null, error };
    }
  }

  async updateFundingRequest(
    requestId: string, 
    status: 'approved' | 'rejected' | 'completed',
    adminNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('funding_requests')
        .update({ 
          status,
          updated_at: new Date().toISOString(),
          admin_notes: adminNotes
        })
        .eq('id', requestId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error updating funding request:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async getAdminStats(): Promise<AdminStats> {
    try {
      const [
        usersResult, 
        walletsResult, 
        tradesResult, 
        ordersResult,
        fundingRequestsResult
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('wallets').select('balance'),
        supabase.from('trades').select('total').gte('created_at', new Date().toISOString().split('T')[0]),
        supabase.from('trades').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('funding_requests').select('id', { count: 'exact' }).eq('status', 'pending')
      ]);

      const totalUsers = usersResult.count || 0;
      const totalWalletBalance = walletsResult.data?.reduce((sum, w) => sum + w.balance, 0) || 0;
      const totalVolumeToday = tradesResult.data?.reduce((sum, t) => sum + t.total, 0) || 0;
      const pendingOrders = ordersResult.count || 0;
      const pendingFundingRequests = fundingRequestsResult.count || 0;

      return {
        total_users: totalUsers,
        active_users: totalUsers, // Simplified
        total_wallet_balance: totalWalletBalance,
        total_trades_today: tradesResult.data?.length || 0,
        pending_orders: pendingOrders,
        pending_funding_requests: pendingFundingRequests,
        total_volume_today: totalVolumeToday
      };
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      return {
        total_users: 0,
        active_users: 0,
        total_wallet_balance: 0,
        total_trades_today: 0,
        pending_orders: 0,
        pending_funding_requests: 0,
        total_volume_today: 0
      };
    }
  }

  async getUserStats(userId: string): Promise<UserStats> {
    try {
      const [holdingsResult, tradesResult, walletResult] = await Promise.all([
        supabase.from('portfolio_holdings').select('shares, average_price, current_price').eq('user_id', userId),
        supabase.from('trades').select('total, type').eq('user_id', userId),
        supabase.from('wallet_transactions').select('amount, type').eq('wallet_id', userId)
      ]);

      const holdings = holdingsResult.data || [];
      const trades = tradesResult.data || [];
      const transactions = walletResult.data || [];

      const totalPortfolioValue = holdings.reduce((sum, h) => sum + (h.shares * h.current_price), 0);
      const totalCost = holdings.reduce((sum, h) => sum + (h.shares * h.average_price), 0);
      const profitLoss = totalPortfolioValue - totalCost;
      const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

      const deposits = transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0);
      const withdrawals = transactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + Math.abs(t.amount), 0);

      return {
        total_portfolio_value: totalPortfolioValue,
        total_trades: trades.length,
        total_deposits: deposits,
        total_withdrawals: withdrawals,
        profit_loss: profitLoss,
        profit_loss_percent: profitLossPercent
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return {
        total_portfolio_value: 0,
        total_trades: 0,
        total_deposits: 0,
        total_withdrawals: 0,
        profit_loss: 0,
        profit_loss_percent: 0
      };
    }
  }
}

export const adminService = new AdminService();