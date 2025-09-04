import React from 'react';
import { PortfolioOverview } from './PortfolioOverview';
import { AssetCard } from './AssetCard';
import { PerformanceChart } from './PerformanceChart';
import { AIInsights } from './AIInsights';
import { MarketNews } from './MarketNews';
import { Settings } from './Settings';
import { Profile } from './Profile';
import { TradingDashboard } from './TradingDashboard';
import { WalletDashboard } from './WalletDashboard';
import { AdminDashboard } from './AdminDashboard';
import { Bell, Search, PieChart, TrendingUp, User, Shield, Wallet } from 'lucide-react';
import { usePortfolioData } from '../hooks/usePortfolioData';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import { 
  mockAIInsights, 
  mockMarketNews, 
  generateChartData 
} from '../utils/mockData';

interface TabContentProps {
  activeTab: string;
}

export const TabContent: React.FC<TabContentProps> = ({ activeTab }) => {
  const { user } = useFirebaseAuth();
  const { assets, portfolioStats, loading } = usePortfolioData();
  const chartData = generateChartData(30);

  // Check if user is admin (in a real app, this would be based on user roles)
  const isAdmin = user?.email?.includes('admin') || user?.email?.includes('support');

  const renderDashboard = () => (
    <div className="space-y-5">
      {/* Welcome Header */}
      <div className="mb-3">
        <h1 className="text-xl font-bold text-white mb-1">
          Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}
        </h1>
        <p className="text-xs text-slate-400">Here's what's happening with your investments today.</p>
      </div>

      {portfolioStats && <PortfolioOverview stats={portfolioStats} />}
      
      <div className="mb-5">
        <PerformanceChart data={chartData} />
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <div className="mb-3">
            <h2 className="text-base font-bold text-white mb-1">Your Holdings</h2>
            <p className="text-xs text-slate-400">Manage and track your investment portfolio</p>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5 animate-pulse">
                  <div className="h-3 bg-slate-700 rounded w-3/4 mb-3"></div>
                  <div className="h-6 bg-slate-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : assets.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {assets.map((asset) => (
                <AssetCard key={asset.id} asset={asset} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl">
              <PieChart className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white mb-2">No Holdings Yet</h3>
              <p className="text-xs text-slate-400 mb-3">Start building your portfolio by making your first trade</p>
            </div>
          )}
        </div>
        <div className="space-y-5">
          <AIInsights insights={mockAIInsights} />
          <MarketNews news={mockMarketNews} />
        </div>
      </div>
    </div>
  );

  const renderTrading = () => <TradingDashboard />;

  const renderWallet = () => <WalletDashboard />;

  const renderPortfolio = () => (
    <div className="space-y-5">
      <div className="mb-3">
        <h1 className="text-xl font-bold text-white mb-1">Portfolio Management</h1>
        <p className="text-xs text-slate-400">Detailed view of your investment holdings and performance</p>
      </div>
      {portfolioStats && <PortfolioOverview stats={portfolioStats} />}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5 animate-pulse">
              <div className="h-3 bg-slate-700 rounded w-3/4 mb-3"></div>
              <div className="h-6 bg-slate-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : assets.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {assets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl">
          <PieChart className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white mb-2">No Holdings Yet</h3>
          <p className="text-xs text-slate-400">Start building your portfolio by making your first trade</p>
        </div>
      )}
    </div>
  );

  const renderPerformance = () => (
    <div className="space-y-5">
      <div className="mb-3">
        <h1 className="text-xl font-bold text-white mb-1">Performance Analytics</h1>
        <p className="text-xs text-slate-400">Track your investment performance and analyze trends over time</p>
      </div>
      <PerformanceChart data={chartData} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center space-x-3 mb-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <h3 className="text-sm font-semibold text-white">Best Performer</h3>
          </div>
          <p className="text-base font-bold text-green-400">NVDA</p>
          <p className="text-xs text-slate-400">+15.67 (1.82%)</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center space-x-3 mb-2">
            <PieChart className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Diversification</h3>
          </div>
          <p className="text-base font-bold text-blue-400">86.2%</p>
          <p className="text-xs text-slate-400">Technology sector</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center space-x-3 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">Volatility</h3>
          </div>
          <p className="text-base font-bold text-purple-400">12.4%</p>
          <p className="text-xs text-slate-400">30-day average</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center space-x-3 mb-2">
            <TrendingUp className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-semibold text-white">Sharpe Ratio</h3>
          </div>
          <p className="text-base font-bold text-orange-400">1.84</p>
          <p className="text-xs text-slate-400">Risk-adjusted return</p>
        </div>
      </div>
    </div>
  );

  const renderInsights = () => (
    <div className="space-y-5">
      <div className="mb-3">
        <h1 className="text-xl font-bold text-white mb-1">AI-Powered Insights</h1>
        <p className="text-xs text-slate-400">Advanced analytics and personalized investment recommendations</p>
      </div>
      <AIInsights insights={mockAIInsights} />
    </div>
  );

  const renderNews = () => (
    <div className="space-y-5">
      <div className="mb-3">
        <h1 className="text-xl font-bold text-white mb-1">Market News</h1>
        <p className="text-xs text-slate-400">Stay updated with the latest market developments and financial news</p>
      </div>
      <MarketNews news={mockMarketNews} />
    </div>
  );

  const renderPlaceholder = (title: string, icon: React.ReactNode, description: string) => (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="p-4 bg-slate-800/50 rounded-full mb-4">
        {icon}
      </div>
      <h2 className="text-lg font-bold text-white mb-2">{title}</h2>
      <p className="text-xs text-slate-400 max-w-md">{description}</p>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-5">
      <div className="mb-3">
        <h1 className="text-xl font-bold text-white mb-1">Notifications</h1>
        <p className="text-xs text-slate-400">Stay informed about your portfolio and market updates</p>
      </div>
      {renderPlaceholder(
        'Notifications Center', 
        <Bell className="w-8 h-8 text-slate-400" />,
        'Get real-time alerts about price changes, news updates, and portfolio performance. This feature is coming soon.'
      )}
    </div>
  );

  const renderResearch = () => (
    <div className="space-y-5">
      <div className="mb-3">
        <h1 className="text-xl font-bold text-white mb-1">Research Tools</h1>
        <p className="text-xs text-slate-400">Advanced tools for market analysis and investment research</p>
      </div>
      {renderPlaceholder(
        'Research & Analysis', 
        <Search className="w-8 h-8 text-slate-400" />,
        'Access comprehensive market data, technical analysis tools, and fundamental research. Advanced features coming soon.'
      )}
    </div>
  );

  const renderAdmin = () => (
    <AdminDashboard />
  );

  switch (activeTab) {
    case 'dashboard':
      return renderDashboard();
    case 'trading':
      return renderTrading();
    case 'wallet':
      return renderWallet();
    case 'portfolio':
      return renderPortfolio();
    case 'performance':
      return renderPerformance();
    case 'insights':
      return renderInsights();
    case 'news':
      return renderNews();
    case 'research':
      return renderResearch();
    case 'notifications':
      return renderNotifications();
    case 'settings':
      return <Settings />;
    case 'profile':
      return <Profile />;
    case 'admin':
      return renderAdmin();
    default:
      return renderDashboard();
  }
};