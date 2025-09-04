import React from 'react';
import { Bell, Settings, User } from 'lucide-react';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import logo from '../assets/logo.png';

interface TopUtilityBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const TopUtilityBar: React.FC<TopUtilityBarProps> = ({ activeTab, onTabChange }) => {
  const { user } = useFirebaseAuth();

  const utilityTabs = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left side - App branding - Only logo, no text */}
        <div className="flex items-center">
          <img src={logo} alt="SafeGuard" className="h-10" />
        </div>

        {/* Right side - Utility tabs and user info */}
        <div className="flex items-center space-x-4">
          {/* Utility Navigation */}
          <div className="flex items-center space-x-2">
            {utilityTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`relative flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                    isActive
                      ? 'bg-slate-800 text-white border border-slate-600'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.id === 'notifications' && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>

          {/* User Avatar */}
          {user && (
            <div className="flex items-center space-x-3 pl-4 border-l border-slate-700/50">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-gray-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-white">
                  {user.email?.split('@')[0]}
                </p>
                <p className="text-xs text-slate-400">Investor</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};