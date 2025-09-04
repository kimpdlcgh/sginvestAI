import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Activity, DollarSign } from 'lucide-react';
import { marketDataService } from '../services/marketData';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface LivePrice {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  shares: number;
  value: number;
  lastUpdated: Date;
}

export const LivePortfolioPrices: React.FC = () => {
  const { user } = useAuth();
  const [livePrices, setLivePrices] = useState<LivePrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [totalValue, setTotalValue] = useState(0);
  const [totalChange, setTotalChange] = useState(0);

  useEffect(() => {
    if (user) {
      loadLivePrices();
      // Update every 30 seconds
      const interval = setInterval(loadLivePrices, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadLivePrices = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get user's portfolio holdings
      const holdingsQuery = query(
        collection(db, 'portfolioHoldings'),
        where('userId', '==', user.id)
      );
      
      const holdingsSnapshot = await getDocs(holdingsQuery);
      const holdings = holdingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (!holdings || holdings.length === 0) {
        setLivePrices([]);
        setTotalValue(0);
        setTotalChange(0);
        return;
      }

      // Get live prices for all holdings
      const pricesPromises = holdings.map(async (holding) => {
        try {
          const quote = await marketDataService.getQuote(holding.symbol);
          const currentValue = holding.shares * quote.price;
          const costBasis = holding.shares * holding.averagePrice;
          const gainLoss = currentValue - costBasis;

          return {
            symbol: holding.symbol,
            name: holding.name,
            price: quote.price,
            change: quote.change,
            changePercent: quote.changePercent,
            shares: holding.shares,
            value: currentValue,
            gainLoss,
            lastUpdated: new Date(),
          };
        } catch (error) {
          console.error(`Error fetching price for ${holding.symbol}:`, error);
          // Return holding with last known price
          return {
            symbol: holding.symbol,
            name: holding.name,
            price: holding.averagePrice,
            change: 0,
            changePercent: 0,
            shares: holding.shares,
            value: holding.shares * holding.averagePrice,
            gainLoss: 0,
            lastUpdated: new Date(),
          };
        }
      });

      const prices = await Promise.all(pricesPromises);
      setLivePrices(prices);

      // Calculate totals
      const total = prices.reduce((sum, price) => sum + price.value, 0);
      const dayChange = prices.reduce((sum, price) => sum + (price.change * price.shares), 0);
      
      setTotalValue(total);
      setTotalChange(dayChange);
      setLastUpdate(new Date());

      console.log('✅ Live prices updated:', {
        assets: prices.length,
        totalValue: total,
        totalChange: dayChange
      });

    } catch (error) {
      console.error('Error loading live prices:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (!user) return null;

  if (livePrices.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Activity className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">Live Portfolio Prices</h3>
              <p className="text-xs text-slate-400">No holdings to display</p>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            Start trading to see live prices
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Activity className="w-5 h-5 text-blue-400" />
          <div>
            <h3 className="text-sm font-semibold text-white">Live Portfolio Prices</h3>
            <p className="text-xs text-slate-400">
              {livePrices.length} holdings • Updated {formatTime(lastUpdate)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Portfolio Summary */}
          <div className="text-right">
            <div className="text-sm font-bold text-white">{formatCurrency(totalValue)}</div>
            <div className={`text-xs flex items-center space-x-1 ${totalChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalChange >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{totalChange >= 0 ? '+' : ''}{formatCurrency(totalChange)}</span>
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={loadLivePrices}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            title="Refresh prices"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Live Prices Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {livePrices.map((asset) => (
          <div
            key={asset.symbol}
            className="bg-slate-700/30 rounded-lg p-3 hover:bg-slate-700/50 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {asset.symbol.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{asset.symbol}</div>
                  <div className="text-xs text-slate-400">{asset.shares} shares</div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm font-bold text-white">{formatCurrency(asset.price)}</div>
                <div className={`text-xs flex items-center space-x-1 ${asset.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {asset.change >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{formatPercent(asset.changePercent)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Value:</span>
              <span className="text-white font-medium">{formatCurrency(asset.value)}</span>
            </div>

            {/* Live indicator */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-600/50">
              <div className="flex items-center space-x-1">
                <div className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
                <span className="text-xs text-slate-500">Live</span>
              </div>
              <span className="text-xs text-slate-500">
                {formatTime(asset.lastUpdated)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Auto-refresh indicator */}
      <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          <span>Auto-refresh every 30 seconds</span>
        </div>
        <span>Next update in {30 - (new Date().getSeconds() % 30)}s</span>
      </div>
    </div>
  );
};