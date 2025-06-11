import React, { useState } from 'react';
import { 
  Home, 
  TrendingUp, 
  PieChart, 
  Brain, 
  Newspaper, 
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
  Wallet
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePortfolioData } from '../hooks/usePortfolioData';
import logo1 from '../assets/logo1.png';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, signOut } = useAuth();
  const { portfolioStats } = usePortfolioData();

  // Check if user is admin (in a real app, this would be based on user roles)
  const isAdmin = user?.email?.includes('admin') || user?.email?.includes('support');

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'trading', label: 'Trading', icon: ArrowUpDown },
    { id: 'portfolio', label: 'Portfolio', icon: PieChart },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'insights', label: 'AI Insights', icon: Brain },
    { id: 'news', label: 'Market News', icon: Newspaper },
    { id: 'research', label: 'Research', icon: Search },
  ];

  // Add admin section if user is admin
  if (isAdmin) {
    navigationItems.push({ id: 'admin', label: 'Admin', icon: Shield });
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className={`bg-slate-900/95 backdrop-blur-sm border-r border-slate-700/50 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-60'
    } flex flex-col h-screen sticky top-0`}>
      {/* Header with collapse toggle */}
      <div className="p-3 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center">
              <img src={logo1} alt="SafeGuard" className="h-8" />
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all duration-200"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-3">
        <nav className="space-y-1 px-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-green-500/20 to-gray-600/20 border border-green-500/30 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-green-400' : 'group-hover:text-white'}`} />
                {!isCollapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
                {isActive && !isCollapsed && (
                  <div className="ml-auto w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Portfolio Summary */}
        {!isCollapsed && user && portfolioStats && (
          <div className="mx-3 mt-6 p-4 bg-gradient-to-br from-slate-800/50 to-slate-700/30 border border-slate-600/30 rounded-xl">
            <h3 className="text-xs font-semibold text-white mb-3">Portfolio Overview</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Total Value</span>
                <span className="text-sm font-bold text-green-400">
                  {formatCurrency(portfolioStats.totalValue)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Today's Change</span>
                <span className={`text-xs font-medium ${
                  portfolioStats.dayChange >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {portfolioStats.dayChange >= 0 ? '+' : ''}{formatCurrency(portfolioStats.dayChange)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Total Gain</span>
                <span className={`text-xs font-medium ${
                  portfolioStats.totalGain >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {portfolioStats.totalGain >= 0 ? '+' : ''}{portfolioStats.totalGainPercent.toFixed(2)}%
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2">
                <div className={`h-1.5 rounded-full transition-all duration-500 ${
                  portfolioStats.totalGainPercent >= 0 
                    ? 'bg-gradient-to-r from-green-500 to-gray-600' 
                    : 'bg-gradient-to-r from-red-500 to-orange-500'
                }`} style={{ width: `${Math.min(Math.abs(portfolioStats.totalGainPercent) * 2, 100)}%` }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="border-t border-slate-700/50 p-3">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-slate-400 hover:text-white hover:bg-slate-800/50"
        >
          <LogOut className="w-4 h-4" />
          {!isCollapsed && <span className="text-sm">Sign Out</span>}
        </button>
      </div>
    </div>
  );
};