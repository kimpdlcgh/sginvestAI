import React, { useState, useEffect } from 'react';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  Plus,
  Search,
  Filter,
  MoreVertical,
  Wallet,
  ShoppingCart,
  BarChart3,
  Settings,
  UserPlus,
  CreditCard,
  Activity,
  Bell,
  CheckCircle,
  Clock
} from 'lucide-react';
import { AdminStats, User, AdminOrder } from '../types/admin';
import { firebaseAdminService } from '../services/firebaseAdminService';
import { UserManagement } from './admin/UserManagement';
import { OrderManagement } from './admin/OrderManagement';
import { WalletManagement } from './admin/WalletManagement';
import { FundingRequestsManagement } from './admin/FundingRequestsManagement';
import { CreateUserModal } from './admin/CreateUserModal';
import { CreateOrderModal } from './admin/CreateOrderModal';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<AdminStats>({
    total_users: 0,
    active_users: 0,
    total_wallet_balance: 0,
    total_trades_today: 0,
    pending_orders: 0,
    total_volume_today: 0
  });
  const [users, setUsers] = useState<User[]>([]);
  const [pendingOrders, setPendingOrders] = useState<AdminOrder[]>([]);
  const [pendingFundingRequests, setPendingFundingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateOrder, setShowCreateOrder] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [adminStats, allUsers, orders] = await Promise.all([
        firebaseAdminService.getAdminStats(),
        firebaseAdminService.getAllUsers(20),
        firebaseAdminService.getPendingOrders()
      ]);

      setStats(adminStats);
      setUsers(allUsers);
      setPendingOrders(orders);
      
      // Load pending funding requests
      try {
        const { data: fundingRequests } = await firebaseAdminService.getPendingFundingRequests();
        setPendingFundingRequests(fundingRequests || []);
      } catch (error) {
        console.warn('Could not load funding requests:', error);
        setPendingFundingRequests([]);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
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

  const adminTabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'wallets', label: 'Wallets', icon: Wallet },
    { id: 'funding', label: 'Funding Requests', icon: CreditCard, badge: pendingFundingRequests.length },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-sm text-slate-400">Total Users</span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-white">{stats.total_users}</p>
            <p className="text-sm text-green-400">+{stats.active_users} active</p>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
            <span className="text-sm text-slate-400">Total Wallet Balance</span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-white">{formatCurrency(stats.total_wallet_balance)}</p>
            <p className="text-sm text-slate-400">Across all users</p>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-sm text-slate-400">Today's Volume</span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-white">{formatCurrency(stats.total_volume_today)}</p>
            <p className="text-sm text-slate-400">{stats.total_trades_today} trades</p>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <AlertCircle className="w-6 h-6 text-orange-400" />
            </div>
            <span className="text-sm text-slate-400">Pending Orders</span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-white">{stats.pending_orders}</p>
            <p className="text-sm text-orange-400">Require attention</p>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <CreditCard className="w-6 h-6 text-yellow-400" />
            </div>
            <span className="text-sm text-slate-400">Funding Requests</span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-white">{pendingFundingRequests.length}</p>
            <p className="text-sm text-yellow-400">Awaiting review</p>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <Activity className="w-6 h-6 text-cyan-400" />
            </div>
            <span className="text-sm text-slate-400">System Status</span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-green-400">Online</p>
            <p className="text-sm text-slate-400">All systems operational</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setShowCreateUser(true)}
            className="flex items-center space-x-3 p-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition-all duration-200"
          >
            <UserPlus className="w-5 h-5 text-blue-400" />
            <span className="text-white font-medium">Create User</span>
          </button>

          <button
            onClick={() => setShowCreateOrder(true)}
            className="flex items-center space-x-3 p-4 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg transition-all duration-200"
          >
            <Plus className="w-5 h-5 text-green-400" />
            <span className="text-white font-medium">Create Order</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className="flex items-center space-x-3 p-4 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-lg transition-all duration-200"
          >
            <AlertCircle className="w-5 h-5 text-orange-400" />
            <span className="text-white font-medium">Review Orders</span>
          </button>

          <button
            onClick={() => setActiveTab('funding')}
            className="flex items-center space-x-3 p-4 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 rounded-lg transition-all duration-200"
          >
            <CreditCard className="w-5 h-5 text-yellow-400" />
            <span className="text-white font-medium">Funding Requests</span>
            {pendingFundingRequests.length > 0 && (
              <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold">
                {pendingFundingRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Users */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Recent Users</h3>
            <button
              onClick={() => setActiveTab('users')}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {users.slice(0, 5).map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium">{user.email}</p>
                    <p className="text-xs text-slate-400">
                      {user.profile?.first_name && user.profile?.last_name 
                        ? `${user.profile.first_name} ${user.profile.last_name}`
                        : 'Profile incomplete'
                      }
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white">
                    {user.wallet ? formatCurrency(user.wallet.balance) : 'No wallet'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Funding Requests */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Recent Funding Requests</h3>
            <button
              onClick={() => setActiveTab('funding')}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {pendingFundingRequests.slice(0, 5).map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{request.user_email}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white">{formatCurrency(request.requested_amount)}</p>
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                    {request.status}
                  </span>
                </div>
              </div>
            ))}
            {pendingFundingRequests.length === 0 && (
              <div className="text-center py-4 text-slate-400">
                <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                <p>No pending funding requests</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'users':
        return <UserManagement onRefresh={loadAdminData} />;
      case 'orders':
        return <OrderManagement onRefresh={loadAdminData} />;
      case 'wallets':
        return <WalletManagement onRefresh={loadAdminData} />;
      case 'funding':
        return <FundingRequestsManagement onRefresh={loadAdminData} />;
      case 'settings':
        return (
          <div className="text-center py-12">
            <Settings className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Admin Settings</h3>
            <p className="text-slate-400">System configuration and admin preferences</p>
          </div>
        );
      default:
        return renderOverview();
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-slate-400">Manage users, orders, funding requests, and platform operations</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateUser(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create User</span>
          </button>
          <button
            onClick={() => setShowCreateOrder(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Order</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-1">
        {adminTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 relative ${
                isActive
                  ? 'bg-blue-500/20 border border-blue-500/30 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : ''}`} />
              <span className="font-medium">{tab.label}</span>
              {tab.badge && tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {renderContent()}

      {/* Modals */}
      {showCreateUser && (
        <CreateUserModal
          onClose={() => setShowCreateUser(false)}
          onSuccess={() => {
            setShowCreateUser(false);
            loadAdminData();
          }}
        />
      )}

      {showCreateOrder && (
        <CreateOrderModal
          onClose={() => setShowCreateOrder(false)}
          onSuccess={() => {
            setShowCreateOrder(false);
            loadAdminData();
          }}
        />
      )}
    </div>
  );
};