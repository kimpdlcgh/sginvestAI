import { supabase } from '../lib/supabase';
import { Wallet, WalletTransaction } from '../types/admin';

export class WalletService {
  async getUserWallet(userId: string): Promise<Wallet | null> {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(); // Use maybeSingle() instead of single() to avoid PGRST116 error

      if (error) {
        console.error('Error fetching user wallet:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user wallet:', error);
      return null;
    }
  }

  async createWallet(userId: string, initialBalance: number = 0): Promise<Wallet> {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .insert({
          user_id: userId,
          balance: initialBalance,
          available_balance: initialBalance,
          pending_balance: 0,
          currency: 'USD',
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      // Create initial transaction if balance > 0
      if (initialBalance > 0) {
        await this.addTransaction(data.id, {
          type: 'deposit',
          amount: initialBalance,
          description: 'Initial wallet funding',
          created_by: 'system'
        });
      }

      return data;
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw error;
    }
  }

  async updateWalletBalance(
    walletId: string, 
    amount: number, 
    type: 'deposit' | 'withdrawal' | 'trade_buy' | 'trade_sell' | 'fee' | 'adjustment',
    description: string,
    createdBy: string = 'system',
    referenceId?: string
  ): Promise<{ success: boolean; newBalance?: number; error?: string }> {
    try {
      // Get current wallet
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('id', walletId)
        .single();

      if (walletError) throw walletError;

      const currentBalance = wallet.balance;
      const newBalance = currentBalance + amount;

      // Check for sufficient funds on withdrawals/purchases
      if ((type === 'withdrawal' || type === 'trade_buy' || type === 'fee') && newBalance < 0) {
        return { 
          success: false, 
          error: 'Insufficient funds' 
        };
      }

      // Update wallet balance
      const { error: updateError } = await supabase
        .from('wallets')
        .update({
          balance: newBalance,
          available_balance: newBalance, // Simplified - in production, handle pending amounts
          updated_at: new Date().toISOString()
        })
        .eq('id', walletId);

      if (updateError) throw updateError;

      // Add transaction record
      await this.addTransaction(walletId, {
        type,
        amount,
        description,
        reference_id: referenceId,
        created_by: createdBy,
        balance_before: currentBalance,
        balance_after: newBalance
      });

      return { success: true, newBalance };
    } catch (error) {
      console.error('Error updating wallet balance:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async addTransaction(
    walletId: string, 
    transaction: Partial<WalletTransaction>
  ): Promise<WalletTransaction> {
    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: walletId,
          ...transaction,
          status: transaction.status || 'completed'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding wallet transaction:', error);
      throw error;
    }
  }

  async getWalletTransactions(
    walletId: string, 
    limit: number = 50
  ): Promise<WalletTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', walletId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
      return [];
    }
  }

  async checkSufficientFunds(userId: string, amount: number): Promise<boolean> {
    try {
      const wallet = await this.getUserWallet(userId);
      return wallet ? wallet.available_balance >= amount : false;
    } catch (error) {
      console.error('Error checking sufficient funds:', error);
      return false;
    }
  }
}

export const walletService = new WalletService();