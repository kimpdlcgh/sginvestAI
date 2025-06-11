import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';
import { PortfolioStats } from '../types';

interface PortfolioOverviewProps {
  stats: PortfolioStats;
}

export const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({ stats }) => {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800/70 transition-all duration-200">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <DollarSign className="w-5 h-5 text-blue-400" />
          </div>
          <span className="text-xs text-slate-400">Total Value</span>
        </div>
        <div className="space-y-1">
          <p className="text-xl font-bold text-white">{formatCurrency(stats.totalValue)}</p>
          <div className="flex items-center space-x-2">
            {stats.dayChange >= 0 ? (
              <TrendingUp className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-red-400" />
            )}
            <span className={`text-xs ${stats.dayChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(stats.dayChange)} ({formatPercent(stats.dayChangePercent)})
            </span>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800/70 transition-all duration-200">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <span className="text-xs text-slate-400">Total Gain</span>
        </div>
        <div className="space-y-1">
          <p className="text-xl font-bold text-green-400">{formatCurrency(stats.totalGain)}</p>
          <p className="text-xs text-green-400">{formatPercent(stats.totalGainPercent)}</p>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800/70 transition-all duration-200">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Target className="w-5 h-5 text-purple-400" />
          </div>
          <span className="text-xs text-slate-400">Holdings</span>
        </div>
        <div className="space-y-1">
          <p className="text-xl font-bold text-white">5</p>
          <p className="text-xs text-slate-400">Active positions</p>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800/70 transition-all duration-200">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 bg-orange-500/10 rounded-lg">
            <TrendingUp className="w-5 h-5 text-orange-400" />
          </div>
          <span className="text-xs text-slate-400">Performance</span>
        </div>
        <div className="space-y-1">
          <p className="text-xl font-bold text-orange-400">+14.5%</p>
          <p className="text-xs text-slate-400">This year</p>
        </div>
      </div>
    </div>
  );
};