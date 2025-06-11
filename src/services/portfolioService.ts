import { supabase } from '../lib/supabase';
import { marketDataService } from './marketData';
import { Asset, PortfolioStats } from '../types';

export class PortfolioService {
  async getUserPortfolio(userId: string): Promise<Asset[]> {
    try {
      console.log('🔍 Fetching portfolio for user:', userId);
      
      const { data: portfolioData, error } = await supabase
        .from('portfolio_holdings')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Supabase error fetching portfolio:', error);
        throw error;
      }

      console.log(`📊 Found ${portfolioData?.length || 0} portfolio holdings`);

      // If no holdings, return empty array
      if (!portfolioData || portfolioData.length === 0) {
        return [];
      }

      // Get current prices for all holdings with better error handling
      const assets: Asset[] = [];
      for (const holding of portfolioData) {
        try {
          const quote = await marketDataService.getQuote(holding.symbol);
          
          const currentValue = holding.shares * quote.price;
          const totalCost = holding.shares * holding.average_price;
          const change = currentValue - totalCost;
          const changePercent = totalCost > 0 ? (change / totalCost) * 100 : 0;

          assets.push({
            id: holding.id,
            symbol: holding.symbol,
            name: holding.name,
            price: quote.price,
            change: quote.change,
            changePercent: quote.changePercent,
            shares: holding.shares,
            value: currentValue,
            allocation: 0, // Will be calculated after all assets are loaded
            sector: holding.sector || 'Technology',
          });
        } catch (error) {
          console.warn(`⚠️ Error fetching quote for ${holding.symbol}:`, error.message);
          // Use stored data as fallback
          const currentValue = holding.shares * (holding.current_price || holding.average_price);
          assets.push({
            id: holding.id,
            symbol: holding.symbol,
            name: holding.name,
            price: holding.current_price || holding.average_price,
            change: 0,
            changePercent: 0,
            shares: holding.shares,
            value: currentValue,
            allocation: 0,
            sector: holding.sector || 'Technology',
          });
        }
      }

      // Calculate allocations
      const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
      assets.forEach(asset => {
        asset.allocation = totalValue > 0 ? (asset.value / totalValue) * 100 : 0;
      });

      console.log(`✅ Successfully processed ${assets.length} portfolio assets`);
      return assets;
    } catch (error) {
      console.error('❌ Error fetching user portfolio:', error);
      
      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error('🌐 Network error - unable to connect to Supabase. Check your internet connection.');
        throw new Error('Unable to connect to database. Please check your internet connection and try again.');
      }
      
      // Check if it's a Supabase configuration error
      if (error.message?.includes('Invalid API key') || error.message?.includes('Project not found')) {
        console.error('🔑 Supabase configuration error - check your API keys');
        throw new Error('Database configuration error. Please check your Supabase settings.');
      }
      
      throw error;
    }
  }

  async getPortfolioStats(userId: string): Promise<PortfolioStats> {
    try {
      console.log('📈 Calculating portfolio stats for user:', userId);
      
      const assets = await this.getUserPortfolio(userId);
      const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
      
      // Calculate total cost basis
      const { data: portfolioData, error } = await supabase
        .from('portfolio_holdings')
        .select('shares, average_price')
        .eq('user_id', userId);

      if (error) {
        console.warn('⚠️ Error fetching cost basis data:', error);
        // Return basic stats without cost basis
        return {
          totalValue,
          totalGain: 0,
          totalGainPercent: 0,
          dayChange: 0,
          dayChangePercent: 0,
        };
      }

      const totalCost = portfolioData?.reduce((sum, holding) => 
        sum + (holding.shares * holding.average_price), 0) || 0;

      const totalGain = totalValue - totalCost;
      const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

      // Calculate day change (simplified - would need historical data for accuracy)
      const dayChange = assets.reduce((sum, asset) => 
        sum + (asset.change * asset.shares), 0);
      const dayChangePercent = totalValue > 0 ? (dayChange / totalValue) * 100 : 0;

      const stats = {
        totalValue,
        totalGain,
        totalGainPercent,
        dayChange,
        dayChangePercent,
      };

      console.log('✅ Portfolio stats calculated:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error calculating portfolio stats:', error);
      return {
        totalValue: 0,
        totalGain: 0,
        totalGainPercent: 0,
        dayChange: 0,
        dayChangePercent: 0,
      };
    }
  }

  async addToPortfolio(userId: string, symbol: string, name: string, shares: number, price: number, sector: string) {
    try {
      console.log(`➕ Adding to portfolio: ${shares} shares of ${symbol} at $${price}`);
      
      // Check if user already owns this stock - use array query instead of single()
      const { data: existingArray, error: fetchError } = await supabase
        .from('portfolio_holdings')
        .select('*')
        .eq('user_id', userId)
        .eq('symbol', symbol);

      if (fetchError) {
        console.error('❌ Error checking existing holdings:', fetchError);
        throw fetchError;
      }

      const existing = existingArray && existingArray.length > 0 ? existingArray[0] : null;

      if (existing) {
        // Update existing holding (average down/up)
        const newShares = existing.shares + shares;
        const newAveragePrice = ((existing.shares * existing.average_price) + (shares * price)) / newShares;

        console.log(`📊 Updating existing position: ${existing.shares} + ${shares} = ${newShares} shares`);

        const { error: updateError } = await supabase
          .from('portfolio_holdings')
          .update({
            shares: newShares,
            average_price: newAveragePrice,
            current_price: price,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error('❌ Error updating portfolio holding:', updateError);
          throw updateError;
        }
      } else {
        // Create new holding
        console.log(`🆕 Creating new portfolio holding for ${symbol}`);
        
        const { error: insertError } = await supabase
          .from('portfolio_holdings')
          .insert({
            user_id: userId,
            symbol,
            name,
            shares,
            average_price: price,
            current_price: price,
            sector: sector || 'Technology',
          });

        if (insertError) {
          console.error('❌ Error creating portfolio holding:', insertError);
          throw insertError;
        }
      }

      console.log('✅ Successfully added to portfolio');
      return { success: true };
    } catch (error) {
      console.error('❌ Error adding to portfolio:', error);
      return { success: false, error };
    }
  }

  async removeFromPortfolio(userId: string, symbol: string, shares: number) {
    try {
      console.log(`➖ Removing from portfolio: ${shares} shares of ${symbol}`);
      
      // Use array query instead of single() to avoid PGRST116 error
      const { data: existingArray, error: fetchError } = await supabase
        .from('portfolio_holdings')
        .select('*')
        .eq('user_id', userId)
        .eq('symbol', symbol);

      if (fetchError) {
        console.error('❌ Error fetching existing holdings:', fetchError);
        throw fetchError;
      }

      const existing = existingArray && existingArray.length > 0 ? existingArray[0] : null;

      if (!existing) {
        throw new Error('Position not found');
      }

      if (shares >= existing.shares) {
        // Remove entire position
        console.log(`🗑️ Removing entire position for ${symbol}`);
        
        const { error: deleteError } = await supabase
          .from('portfolio_holdings')
          .delete()
          .eq('id', existing.id);

        if (deleteError) {
          console.error('❌ Error deleting portfolio holding:', deleteError);
          throw deleteError;
        }
      } else {
        // Reduce position
        console.log(`📉 Reducing position: ${existing.shares} - ${shares} = ${existing.shares - shares} shares`);
        
        const { error: updateError } = await supabase
          .from('portfolio_holdings')
          .update({
            shares: existing.shares - shares,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error('❌ Error updating portfolio holding:', updateError);
          throw updateError;
        }
      }

      console.log('✅ Successfully removed from portfolio');
      return { success: true };
    } catch (error) {
      console.error('❌ Error removing from portfolio:', error);
      return { success: false, error };
    }
  }

  async updatePortfolioPrices(userId: string) {
    try {
      console.log('🔄 Updating portfolio prices for user:', userId);
      
      const { data: portfolioData, error } = await supabase
        .from('portfolio_holdings')
        .select('id, symbol')
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error fetching portfolio for price update:', error);
        throw error;
      }

      if (!portfolioData || portfolioData.length === 0) {
        console.log('📭 No portfolio holdings to update');
        return { success: true };
      }

      let updatedCount = 0;
      for (const holding of portfolioData) {
        try {
          const quote = await marketDataService.getQuote(holding.symbol);
          
          await supabase
            .from('portfolio_holdings')
            .update({
              current_price: quote.price,
              updated_at: new Date().toISOString(),
            })
            .eq('id', holding.id);
          
          updatedCount++;
        } catch (error) {
          console.warn(`⚠️ Error updating price for ${holding.symbol}:`, error.message);
        }
      }

      console.log(`✅ Updated prices for ${updatedCount}/${portfolioData.length} holdings`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating portfolio prices:', error);
      return { success: false, error };
    }
  }
}

export const portfolioService = new PortfolioService();