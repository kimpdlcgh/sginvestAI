import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { marketDataService } from '../services/marketData';

interface TickerData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export const LiveMarketTicker: React.FC = () => {
  const [tickerData, setTickerData] = useState<TickerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<any>(null);

  const loadTickerData = async () => {
    try {
      setError(null);
      const data = await marketDataService.getTickerData();
      const status = marketDataService.getAPIStatus();
      
      setTickerData(data);
      setApiStatus(status);
      
      // Show info message if using mock data
      if (!status.finnhub.configured && !status.alphaVantage.configured) {
        setError('Using demo data - Configure API keys for live market data');
      } else if (status.finnhub.rateLimited && status.alphaVantage.rateLimited) {
        setError('API rate limits reached - Using cached/demo data');
      }
      
    } catch (err) {
      console.warn('Ticker data error:', err);
      setError('Market data temporarily unavailable');
      
      // Set fallback data to prevent empty ticker
      setTickerData([
        { symbol: 'AAPL', name: 'Apple Inc.', price: 150.25, change: 2.15, changePercent: 1.45 },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 2750.80, change: -15.20, changePercent: -0.55 },
        { symbol: 'MSFT', name: 'Microsoft Corp.', price: 305.50, change: 4.25, changePercent: 1.41 },
        { symbol: 'TSLA', name: 'Tesla Inc.', price: 245.75, change: -8.50, changePercent: -3.34 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickerData();
    
    // Refresh every 2 minutes to respect API limits
    const interval = setInterval(loadTickerData, 120000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    if (!apiStatus) return <Wifi className="w-4 h-4 text-gray-400" />;
    
    const hasLiveData = (apiStatus.finnhub.configured && !apiStatus.finnhub.rateLimited) || 
                       (apiStatus.alphaVantage.configured && !apiStatus.alphaVantage.rateLimited);
    
    return hasLiveData ? 
      <Wifi className="w-4 h-4 text-green-400" /> : 
      <WifiOff className="w-4 h-4 text-orange-400" />;
  };

  const getStatusText = () => {
    if (!apiStatus) return 'Connecting...';
    
    const hasLiveData = (apiStatus.finnhub.configured && !apiStatus.finnhub.rateLimited) || 
                       (apiStatus.alphaVantage.configured && !apiStatus.alphaVantage.rateLimited);
    
    return hasLiveData ? 'Live Data' : 'Demo Data';
  };

  if (loading) {
    return (
      <div className="bg-slate-900 border-b border-slate-700/50 py-3 px-6">
        <div className="flex items-center justify-center">
          <div className="animate-pulse text-slate-400">Loading market data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border-b border-slate-700/50 py-3 px-6 relative overflow-hidden">
      {/* Status indicators - positioned on the sides */}
      <div className="absolute top-1/2 left-6 transform -translate-y-1/2 flex items-center space-x-2 text-xs z-10 bg-slate-900/90 px-2 py-1 rounded">
        {getStatusIcon()}
        <span className="text-slate-300 font-medium">{getStatusText()}</span>
      </div>

      {/* Error message */}
      {error && (
        <div className="absolute top-1/2 right-6 transform -translate-y-1/2 flex items-center space-x-2 text-orange-300 text-xs z-10 bg-slate-900/90 px-2 py-1 rounded">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}

      {/* Centered ticker container */}
      <div className="flex justify-center">
        <div className="overflow-hidden max-w-4xl mx-auto">
          <div className="flex animate-scroll space-x-8 whitespace-nowrap">
            {tickerData.concat(tickerData).map((stock, index) => (
              <div key={`${stock.symbol}-${index}`} className="flex items-center space-x-3 text-white">
                <span className="font-bold text-blue-400">{stock.symbol}</span>
                <span className="text-slate-200 font-medium">${stock.price.toFixed(2)}</span>
                <div className={`flex items-center space-x-1 ${
                  stock.change >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {stock.change >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span className="text-sm font-medium">
                    {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};