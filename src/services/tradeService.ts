import { supabase } from '../lib/supabase';
import { portfolioService } from './portfolioService';
import { marketDataService } from './marketData';
import { walletService } from './walletService';

interface TradeOrder {
  symbol: string;
  name: string;
  type: 'buy' | 'sell';
  orderType: 'market' | 'limit' | 'stop';
  quantity: number;
  price?: number;
}

interface Trade {
  id: string;
  user_id: string;
  symbol: string;
  name: string;
  type: 'buy' | 'sell';
  order_type: 'market' | 'limit' | 'stop';
  quantity: number;
  price: number;
  total: number;
  status: 'executed' | 'pending' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export class TradeService {
  async executeTrade(userId: string, order: TradeOrder): Promise<{ success: boolean; trade?: Trade; error?: any }> {
    try {
      // Get current market price
      const quote = await marketDataService.getQuote(order.symbol);
      const executionPrice = order.orderType === 'market' ? quote.price : (order.price || quote.price);
      const total = order.quantity * executionPrice;

      // Check wallet balance for buy orders
      if (order.type === 'buy') {
        const hasSufficientFunds = await walletService.checkSufficientFunds(userId, total);
        if (!hasSufficientFunds) {
          return { 
            success: false, 
            error: { message: 'Insufficient wallet balance for this purchase' } 
          };
        }
      }

      // For paper trading, we'll execute immediately
      // In production, you'd integrate with a real broker API
      const status = order.orderType === 'market' ? 'executed' : 'pending';

      // Record the trade
      const { data: tradeData, error: tradeError } = await supabase
        .from('trades')
        .insert({
          user_id: userId,
          symbol: order.symbol,
          name: order.name,
          type: order.type,
          order_type: order.orderType,
          quantity: order.quantity,
          price: executionPrice,
          total,
          status,
        })
        .select()
        .single();

      if (tradeError) throw tradeError;

      // Update portfolio and wallet if trade is executed
      if (status === 'executed') {
        // Get user's wallet
        let wallet = await walletService.getUserWallet(userId);
        
        // Create wallet if it doesn't exist
        if (!wallet) {
          wallet = await walletService.createWallet(userId, 0);
        }

        if (order.type === 'buy') {
          // Deduct from wallet
          await walletService.updateWalletBalance(
            wallet.id,
            -total,
            'trade_buy',
            `Buy ${order.quantity} shares of ${order.symbol}`,
            'user',
            tradeData.id
          );

          // Add to portfolio
          await portfolioService.addToPortfolio(
            userId,
            order.symbol,
            order.name,
            order.quantity,
            executionPrice,
            'Technology' // Default sector - would get from market data in production
          );
        } else {
          // Remove from portfolio
          await portfolioService.removeFromPortfolio(
            userId,
            order.symbol,
            order.quantity
          );

          // Add to wallet
          await walletService.updateWalletBalance(
            wallet.id,
            total,
            'trade_sell',
            `Sell ${order.quantity} shares of ${order.symbol}`,
            'user',
            tradeData.id
          );
        }
      }

      return { success: true, trade: tradeData };
    } catch (error) {
      console.error('Error executing trade:', error);
      return { success: false, error };
    }
  }

  async getUserTrades(userId: string): Promise<Trade[]> {
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user trades:', error);
      return [];
    }
  }

  async cancelTrade(userId: string, tradeId: string): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await supabase
        .from('trades')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', tradeId)
        .eq('user_id', userId)
        .eq('status', 'pending');

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error cancelling trade:', error);
      return { success: false, error };
    }
  }

  async getTradeHistory(userId: string, limit: number = 50): Promise<Trade[]> {
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching trade history:', error);
      return [];
    }
  }
}

export const tradeService = new TradeService();