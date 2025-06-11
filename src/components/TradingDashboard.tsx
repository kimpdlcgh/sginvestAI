import React, { useState } from 'react';
import { TradingPanel } from './TradingPanel';
import { TradeHistory } from './TradeHistory';
import { PortfolioOverview } from './PortfolioOverview';
import { WalletPanel } from './WalletPanel';
import { usePortfolioData } from '../hooks/usePortfolioData';

export const TradingDashboard: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { portfolioStats } = usePortfolioData();

  const handleNewTrade = () => {
    // Trigger refresh of trade history and portfolio data
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Trading Dashboard</h1>
        <p className="text-slate-400">Execute trades and manage your portfolio</p>
      </div>

      {portfolioStats && <PortfolioOverview stats={portfolioStats} />}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="space-y-8">
          <TradingPanel onTrade={handleNewTrade} />
          <WalletPanel onRefresh={handleNewTrade} />
        </div>
        <TradeHistory refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
};