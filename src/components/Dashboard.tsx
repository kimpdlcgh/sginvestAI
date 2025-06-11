import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TabContent } from './TabContent';
import { TopUtilityBar } from './TopUtilityBar';
import { LiveMarketTicker } from './LiveMarketTicker';
import { marketDataService } from '../services/marketData';

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [apiStatus, setApiStatus] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    // Check API status on component mount
    const checkAPIs = async () => {
      try {
        const status = await marketDataService.getAPIStatus();
        setApiStatus(status);
        
        if (status.finnhub) {
          console.log('🚀 Finnhub API is active - live market data enabled');
        } else {
          console.warn('⚠️ Finnhub API not working - using mock data for ticker');
        }
      } catch (error) {
        console.error('Error checking API status:', error);
      }
    };

    checkAPIs();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Utility Bar with Notifications, Settings, Profile */}
        <TopUtilityBar activeTab={activeTab} onTabChange={setActiveTab} />
        
        {/* Live Market Ticker - Powered by Finnhub */}
        <LiveMarketTicker />
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <TabContent activeTab={activeTab} />
          </div>
        </div>
      </main>
    </div>
  );
};