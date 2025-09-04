import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Globe, 
  CreditCard, 
  Shield, 
  Edit3, 
  Camera,
  Building,
  Flag,
  Clock,
  DollarSign,
  TrendingUp,
  Award,
  Star,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import { userService } from '../services/userService';
import { firebasePortfolioService } from '../services/firebasePortfolioService';
import { firebaseWalletService } from '../services/firebaseWalletService';
import { firebaseTradeService } from '../services/firebaseTradeService';

export const Profile: React.FC = () => {
  const { user } = useFirebaseAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [portfolioStats, setPortfolioStats] = useState({
    totalPortfolioValue: 0,
    totalGain: 0,
    totalGainPercent: 0,
    activeTrades: 0,
    completedTrades: 0,
  });

  useEffect(() => {
    if (user) {
      loadProfileData();
      loadPortfolioStats();
    }
  }, [user?.uid]);

  const loadProfileData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const profile = await userService.getUserProfile(user.uid);
      setProfileData(profile);
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPortfolioStats = async () => {
    if (!user) return;

    try {
      const [assets, trades] = await Promise.all([
        firebasePortfolioService.getUserPortfolio(user.uid),
        firebaseTradeService.getUserTrades(user.uid)
      ]);

      const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
      const totalCost = assets.reduce((sum, asset) => sum + (asset.shares * (asset.value / asset.shares)), 0);
      const totalGain = totalValue - totalCost;
      const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

      setPortfolioStats({
        totalPortfolioValue: totalValue,
        totalGain,
        totalGainPercent,
        activeTrades: assets.length,
        completedTrades: trades.length,
      });
    } catch (err) {
      console.error('Error loading portfolio stats:', err);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not provided';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(dateString));
  };

  const getAccountAge = () => {
    if (!profileData?.created_at) return 'Recently joined';
    
    const now = new Date();
    const created = new Date(profileData.created_at);
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    
    if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''}, ${months} month${months > 1 ? 's' : ''}`;
    }
    return `${months} month${months > 1 ? 's' : ''}`;
  };

  const getCompletionPercentage = () => {
    if (!profileData) return 0;
    
    const fields = [
      'first_name', 'last_name', 'date_of_birth', 'gender', 'nationality',
      'primary_phone', 'language', 'timezone', 'currency',
      'risk_tolerance', 'investment_experience', 'investment_horizon',
      'annual_income', 'employment_status'
    ];
    
    const completedFields = fields.filter(field => 
      profileData[field] && profileData[field].toString().trim() !== ''
    ).length;
    
    return Math.round((completedFields / fields.length) * 100);
  };

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-400 bg-green-500/20';
    if (percentage >= 70) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-red-400 bg-red-500/20';
  };

  const getDisplayName = () => {
    if (!profileData) return user?.email?.split('@')[0] || 'User';
    
    const firstName = profileData.first_name || '';
    const middleName = profileData.middle_name || '';
    const lastName = profileData.last_name || '';
    
    if (firstName || lastName) {
      return `${firstName} ${middleName ? middleName.charAt(0) + '.' : ''} ${lastName}`.trim();
    }
    
    return user?.email?.split('@')[0] || 'User';
  };

  const getInitials = () => {
    if (!profileData) return user?.email?.charAt(0).toUpperCase() || 'U';
    
    const firstName = profileData.first_name || '';
    const lastName = profileData.last_name || '';
    
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-400 mx-auto mb-4 animate-spin" />
          <p className="text-slate-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  const completionPercentage = getCompletionPercentage();

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
        <p className="text-slate-400">View and manage your personal information and account settings</p>
      </div>

      {/* Profile Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {getInitials()}
              </div>
              <button className="absolute -bottom-1 -right-1 p-2 bg-slate-700 hover:bg-slate-600 rounded-full border-2 border-slate-800 transition-colors">
                <Camera className="w-4 h-4 text-white" />
              </button>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                {getDisplayName()}
              </h2>
              <p className="text-slate-400 mb-2">{user?.email}</p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-400">Verified Account</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-blue-400">Secure</span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getCompletionColor(completionPercentage)}`}>
              <Star className="w-4 h-4" />
              <span>{completionPercentage}% Complete</span>
            </div>
            <p className="text-sm text-slate-400 mt-2">
              Member for {getAccountAge()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Profile Information */}
        <div className="lg:col-span-2 space-y-8">
          {/* Personal Information */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
                <User className="w-5 h-5 text-blue-400" />
                <span>Personal Information</span>
              </h3>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center space-x-2 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit in Settings</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
                <p className="text-white font-medium">
                  {profileData?.first_name || profileData?.last_name 
                    ? `${profileData.first_name || ''} ${profileData.middle_name || ''} ${profileData.last_name || ''}`.trim()
                    : 'Not provided'
                  }
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Date of Birth</label>
                <p className="text-white font-medium">{formatDate(profileData?.date_of_birth)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Gender</label>
                <p className="text-white font-medium">{profileData?.gender || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nationality</label>
                <div className="flex items-center space-x-2">
                  <Flag className="w-4 h-4 text-slate-400" />
                  <p className="text-white font-medium">{profileData?.nationality || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
              <Phone className="w-5 h-5 text-green-400" />
              <span>Contact Information</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Email Address</label>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <p className="text-white font-medium">{user?.email}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Primary Phone</label>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <p className="text-white font-medium">{profileData?.primary_phone || 'Not provided'}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Secondary Phone</label>
                <p className="text-white font-medium">{profileData?.secondary_phone || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">WhatsApp</label>
                <p className="text-white font-medium">{profileData?.whatsapp_number || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* International Settings */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
              <Globe className="w-5 h-5 text-orange-400" />
              <span>International Settings</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Language</label>
                <p className="text-white font-medium">{profileData?.language || 'English (US)'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Time Zone</label>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <p className="text-white font-medium">{profileData?.timezone || 'America/New_York (EST)'}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Currency</label>
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  <p className="text-white font-medium">{profileData?.currency || 'USD'}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Date Format</label>
                <p className="text-white font-medium">{profileData?.date_format || 'MM/DD/YYYY'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Information */}
        <div className="space-y-8">
          {/* Account Status */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <span>Account Status</span>
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status</span>
                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-sm rounded-full">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Verification</span>
                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-sm rounded-full">
                  Verified
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Security</span>
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full">
                  Secure
                </span>
              </div>
              <div className="pt-2 border-t border-slate-700/50">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Member for</span>
                  <span className="text-white">{getAccountAge()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Investment Profile */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-yellow-400" />
              <span>Investment Profile</span>
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Risk Tolerance</label>
                <p className="text-white font-medium">{profileData?.risk_tolerance || 'Not set'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Experience</label>
                <p className="text-white font-medium">{profileData?.investment_experience || 'Not set'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Investment Horizon</label>
                <p className="text-white font-medium">{profileData?.investment_horizon || 'Not set'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Employment</label>
                <p className="text-white font-medium">{profileData?.employment_status || 'Not set'}</p>
              </div>
            </div>
          </div>

          {/* Portfolio Summary */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span>Portfolio Summary</span>
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Total Value</label>
                <p className="text-xl font-bold text-white">{formatCurrency(portfolioStats.totalPortfolioValue)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Total Gain</label>
                <p className={`text-lg font-bold ${portfolioStats.totalGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {portfolioStats.totalGain >= 0 ? '+' : ''}{formatCurrency(portfolioStats.totalGain)} ({portfolioStats.totalGainPercent.toFixed(2)}%)
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-700/50">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Active Holdings</label>
                  <p className="text-white font-bold">{portfolioStats.activeTrades}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Total Trades</label>
                  <p className="text-white font-bold">{portfolioStats.completedTrades}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Completion */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <Award className="w-5 h-5 text-purple-400" />
              <span>Profile Completion</span>
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Progress</span>
                <span className="text-white font-bold">{completionPercentage}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
              <div className="text-sm text-slate-400">
                {completionPercentage < 100 ? (
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                    <span>Complete your profile in Settings to unlock all features</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>Profile complete! All features unlocked</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};