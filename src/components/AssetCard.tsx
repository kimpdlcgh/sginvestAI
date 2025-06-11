import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { Asset } from '../types';
import { marketDataService } from '../services/marketData';

interface AssetCardProps {
  asset: Asset;
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset }) => {
  const [livePrice, setLivePrice] = useState(asset.price);
  const [liveChange, setLiveChange] = useState(asset.change);
  const [liveChangePercent, setLiveChangePercent] = useState(asset.changePercent);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    // Update live prices every 30 seconds
    const interval = setInterval(updateLivePrice, 30000);
    return () => clearInterval(interval);
  }, [asset.symbol]);

  const updateLivePrice = async () => {
    try {
      setLoading(true);
      const quote = await marketDataService.getQuote(asset.symbol);
      setLivePrice(quote.price);
      setLiveChange(quote.change);
      setLiveChangePercent(quote.changePercent);
      setLastUpdated(new Date());
    } catch (error) {
      console.error(`Error updating price for ${asset.symbol}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const currentValue = asset.shares * livePrice;

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800/70 transition-all duration-200 hover:scale-[1.01]">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-gray-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {asset.symbol.charAt(0)}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-white">{asset.symbol}</h3>
              <button
                onClick={updateLivePrice}
                disabled={loading}
                className="p-1 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                title="Refresh price"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="text-xs text-slate-400">{asset.name}</p>
            <p className="text-xs text-slate-500">
              Updated: {formatTime(lastUpdated)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-base font-bold text-white">{formatCurrency(livePrice)}</p>
          <div className="flex items-center space-x-1 justify-end">
            {liveChange >= 0 ? (
              <TrendingUp className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-red-400" />
            )}
            <span className={`text-xs ${liveChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatPercent(liveChangePercent)}
            </span>
          </div>
          <p className={`text-xs ${liveChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {liveChange >= 0 ? '+' : ''}{formatCurrency(liveChange)}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-400">Shares</span>
          <span className="text-xs text-white font-medium">{asset.shares}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-400">Current Value</span>
          <span className="text-xs text-white font-medium">{formatCurrency(currentValue)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-400">Avg. Cost</span>
          <span className="text-xs text-white font-medium">{formatCurrency(asset.shares * (asset.value / asset.shares))}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-400">Allocation</span>
          <span className="text-xs text-white font-medium">{asset.allocation.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-400">Sector</span>
          <span className="text-xs text-slate-300">{asset.sector}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-700/50">
        <div className="w-full bg-slate-700 rounded-full h-1.5">
          <div 
            className="bg-gradient-to-r from-green-500 to-gray-600 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(asset.allocation, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Live Data Indicator */}
      <div className="mt-2 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-1">
          <div className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
          <span className="text-slate-400">
            {loading ? 'Updating...' : 'Live data'}
          </span>
        </div>
        <span className="text-slate-500">
          Auto-refresh: 30s
        </span>
      </div>
    </div>
  );
};