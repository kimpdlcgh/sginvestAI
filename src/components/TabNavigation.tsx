import React from 'react';
import { 
  Home, 
  TrendingUp, 
  PieChart, 
  Brain, 
  Newspaper, 
  Search,
  ArrowUpDown,
  Bell,
  Settings,
  User
} from 'lucide-react';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  const mainTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'trading', label: 'Trading', icon: ArrowUpDown },
    { id: 'portfolio', label: 'Portfolio', icon: PieChart },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'insights', label: 'AI Insights', icon: Brain },
    { id: 'news', label: 'Market News', icon: Newspaper },
    { id: 'research', label: 'Research', icon: Search },
  ];

  const utilityTabs = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="flex items-center justify-between h-16">
      {/* Main Navigation Tabs */}
      <div className="flex items-center space-x-1">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                isActive
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : ''}`} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Utility Navigation Tabs */}
      <div className="flex items-center space-x-1">
        {utilityTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
              <span className="hidden md:inline">{tab.label}</span>
              {tab.id === 'notifications' && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};