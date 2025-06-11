import React, { useState } from 'react';
import { TrendingUp, Settings, Bell, User, Menu, X } from 'lucide-react';

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">InvestAI</h1>
              <p className="text-xs text-slate-400">Smart Investment Dashboard</p>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <button className="relative p-2 text-slate-400 hover:text-white transition-colors duration-200">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>
            <button className="p-2 text-slate-400 hover:text-white transition-colors duration-200">
              <Settings className="w-5 h-5" />
            </button>
            <button className="flex items-center space-x-2 p-2 bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors duration-200">
              <User className="w-4 h-4" />
              <span className="text-sm">Profile</span>
            </button>
          </div>

          <button 
            className="md:hidden p-2 text-slate-400 hover:text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden border-t border-slate-700/50 py-4">
            <div className="flex flex-col space-y-2">
              <button className="flex items-center space-x-2 p-2 text-slate-400 hover:text-white">
                <Bell className="w-4 h-4" />
                <span>Notifications</span>
              </button>
              <button className="flex items-center space-x-2 p-2 text-slate-400 hover:text-white">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
              <button className="flex items-center space-x-2 p-2 text-slate-400 hover:text-white">
                <User className="w-4 h-4" />
                <span>Profile</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};