import { useState, useEffect } from 'react';
import { firebasePortfolioService } from '../services/firebasePortfolioService';
import { marketDataService } from '../services/marketData';
import { useFirebaseAuth } from './useFirebaseAuth';
import { testFirebaseConnection } from '../lib/firebase';

interface Asset {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  averagePrice: number;
  currentPrice: number;
  totalValue: number;
  gainLoss: number;
  gainLossPercent: number;
  sector: string;
}

interface PortfolioStats {
  totalValue: number;
  totalGain: number;
  totalGainPercent: number;
  dayChange: number;
  dayChangePercent: number;
}

export function usePortfolioData() {
  const { user } = useFirebaseAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [portfolioStats, setPortfolioStats] = useState<PortfolioStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPortfolioData = async () => {
    if (!user?.uid) {
      setLoading(false);
      setPortfolioStats({
        totalValue: 0,
        totalGain: 0,
        totalGainPercent: 0,
        dayChange: 0,
        dayChangePercent: 0
      });
      setAssets([]);
      return;
    }

    try {
      setError(null);
      
      // Test Firebase connection first
      const connectionTest = await testFirebaseConnection();
      if (!connectionTest) {
        throw new Error('Unable to connect to database. Please check your internet connection and try again.');
      }
      
      // Get portfolio holdings from Firebase
      const holdings = await firebasePortfolioService.getUserPortfolio(user.uid);
      
      if (!holdings || holdings.length === 0) {
        setPortfolioStats({
          totalValue: 0,
          totalGain: 0,
          totalGainPercent: 0,
          dayChange: 0,
          dayChangePercent: 0
        });
        setAssets([]);
        setLoading(false);
        return;
      }

      // Update current prices with better error handling
      const updatedHoldings = await Promise.allSettled(
        holdings.map(async (holding) => {
          try {
            const quote = await marketDataService.getQuote(holding.symbol);
            const currentPrice = quote.price;
            const totalValue = holding.shares * currentPrice;
            const totalCost = holding.shares * holding.averagePrice;
            const gainLoss = totalValue - totalCost;
            const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;

            return {
              ...holding,
              currentPrice,
              totalValue,
              gainLoss,
              gainLossPercent
            };
          } catch (error) {
            console.warn(`Failed to update price for ${holding.symbol}, using stored price`);
            
            // Use stored price as fallback
            const totalValue = holding.shares * holding.currentPrice;
            const totalCost = holding.shares * holding.averagePrice;
            const gainLoss = totalValue - totalCost;
            const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;

            return {
              ...holding,
              totalValue,
              gainLoss,
              gainLossPercent
            };
          }
        })
      );

      // Extract successful results
      const successfulHoldings = updatedHoldings
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result => result.value);

      // Calculate totals
      const totalValue = successfulHoldings.reduce((sum, holding) => sum + holding.totalValue, 0);
      const totalCost = successfulHoldings.reduce((sum, holding) => sum + (holding.shares * holding.averagePrice), 0);
      const totalGain = totalValue - totalCost;
      const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

      // Calculate day change (mock for now - in real app would compare with previous day's closing prices)
      const dayChange = totalValue * 0.012; // Mock 1.2% daily change
      const dayChangePercent = totalValue > 0 ? (dayChange / totalValue) * 100 : 0;

      setPortfolioStats({
        totalValue,
        totalGain,
        totalGainPercent,
        dayChange,
        dayChangePercent
      });

      setAssets(successfulHoldings);

      // Show warning if some prices couldn't be updated
      const failedCount = updatedHoldings.filter(result => result.status === 'rejected').length;
      if (failedCount > 0) {
        console.warn(`Could not update prices for ${failedCount} holdings - using cached prices`);
      }

    } catch (err) {
      console.error('Portfolio data error:', err);
      
      // Provide more specific error messages
      let errorMessage = 'Unable to load portfolio data. Please try again.';
      
      if (err instanceof Error) {
        if (err.message.includes('fetch')) {
          errorMessage = 'Connection failed. Please check your internet connection and Firebase configuration.';
        } else if (err.message.includes('database')) {
          errorMessage = err.message;
        } else if (err.message.includes('JWT')) {
          errorMessage = 'Authentication error. Please sign out and sign back in.';
        }
      }
      
      setError(errorMessage);
      
      // Set empty portfolio as fallback
      setPortfolioStats({
        totalValue: 0,
        totalGain: 0,
        totalGainPercent: 0,
        dayChange: 0,
        dayChangePercent: 0
      });
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolioData();
    
    // Refresh portfolio data every 5 minutes
    const interval = setInterval(loadPortfolioData, 300000);
    return () => clearInterval(interval);
  }, [user?.uid]);

  const refreshPortfolio = () => {
    setLoading(true);
    loadPortfolioData();
  };

  return {
    assets,
    portfolioStats,
    loading,
    error,
    refreshPortfolio
  };
}