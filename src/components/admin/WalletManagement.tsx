import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Search, 
  Filter, 
  Plus, 
  Minus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  User
} from 'lucide-react';
import { User as UserType, WalletTransaction } from '../../types/admin';
import { adminService } from '../../services/adminService';
import { walletService } from '../../services/walletService';

interface WalletManagementProps {
  onRefresh: () => void;
}

export const WalletManagement: React.FC<WalletManagementProps> = ({ onRefresh }) => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdrawal' | 'adjustment'>('deposit');
  const [transactionDescription, setTransactionDescription] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await adminService.getAllUsers(100);
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async (userId: string) => {
    if (!userId) return;
    
    try {
      const user = users.find(u => u.id === userId);
      if (user?.wallet) {
        const userTransactions = await walletService.getWalletTransactions(user.wallet.id);
        setTransactions(userTransactions);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const handleTransaction = async () => {
    if (!selectedUser || !transactionAmount) return;

    try {
      const amount = parseFloat(transactionAmount);
      const adjustedAmount = transactionType === 'withdrawal' ? -Math.abs(amount) : Math.abs(amount);

      const result = await adminService.updateUserWallet(
        selectedUser.id,
        adjustedAmount,
        transactionType,
        transactionDescription || `${transactionType} by admin`,
        'admin' // In real app, use actual admin ID
      );

      if (result.success) {
        setShowTransactionModal(false);
        setTransactionAmount('');
        setTransactionDescription('');
        loadUsers();
        loadTransactions(selectedUser.id);
        onRefresh();
      } else {
        alert(result.error || 'Failed to process transaction');
      }
    } catch (error) {
      console.error('Error processing transaction:', error);
      alert('Failed to process transaction');
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.profile?.first_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (user.profile?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <Plus className="w-4 h-4 text-green-400" />;
      case 'withdrawal':
        return <Minus className="w-4 h-4 text-red-400" />;
      case 'trade_buy':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      case 'trade_sell':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      default:
        return <Activity className="w-4 h-4 text-blue-400" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'trade_sell':
        return 'text-green-400';
      case 'withdrawal':
      case 'trade_buy':
      case 'fee':
        return 'text-red-400';
      default:
        return 'text-blue-400';
    }
  };

  const totalWalletBalance = users.reduce((sum, user) => sum + (user.wallet?.balance || 0), 0);
  const usersWithWallets = users.filter(user => user.wallet).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Wallet Management</h2>
          <p className="text-slate-400">Manage user wallets and transactions</p>
        </div>
        <div className="text-sm text-slate-400">
          {usersWithWallets} wallets • {formatCurrency(totalWalletBalance)} total
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Wallet className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-slate-400">Total Balance</span>
          </div>
          <p className="text-xl font-bold text-white">{formatCurrency(totalWalletBalance)}</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <User className="w-4 h-4 text-green-400" />
            <span className="text-sm text-slate-400">Active Wallets</span>
          </div>
          <p className="text-xl font-bold text-white">{usersWithWallets}</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-slate-400">Avg. Balance</span>
          </div>
          <p className="text-xl font-bold text-white">
            {formatCurrency(usersWithWallets > 0 ? totalWalletBalance / usersWithWallets : 0)}
          </p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Activity className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-slate-400">Transactions</span>
          </div>
          <p className="text-xl font-bold text-white">{transactions.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Users List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">User Wallets</h3>
            <button
              onClick={() => setShowTransactionModal(true)}
              disabled={!selectedUser}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              <span>Add Transaction</span>
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl max-h-96 overflow-y-auto">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => {
                  setSelectedUser(user);
                  loadTransactions(user.id);
                }}
                className={`p-4 border-b border-slate-700/50 last:border-b-0 cursor-pointer transition-colors ${
                  selectedUser?.id === user.id ? 'bg-blue-500/10 border-blue-500/30' : 'hover:bg-slate-700/30'
                }`}
              >
                <div className="flex items-center justify-between">
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
                    <p className="text-white font-medium">
                      {user.wallet ? formatCurrency(user.wallet.balance) : 'No wallet'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {user.wallet?.status || 'Not created'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              Transaction History
              {selectedUser && (
                <span className="text-sm text-slate-400 ml-2">
                  for {selectedUser.email}
                </span>
              )}
            </h3>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl max-h-96 overflow-y-auto">
            {!selectedUser ? (
              <div className="p-8 text-center text-slate-400">
                Select a user to view transaction history
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                No transactions found
              </div>
            ) : (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-4 border-b border-slate-700/50 last:border-b-0"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {getTransactionIcon(transaction.type)}
                      <div>
                        <p className="text-white font-medium capitalize">
                          {transaction.type.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-slate-400">
                          {transaction.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${getTransactionColor(transaction.type)}`}>
                        {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-xs text-slate-400">
                        Balance: {formatCurrency(transaction.balance_after)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{formatDate(transaction.created_at)}</span>
                    <span className={`px-2 py-1 rounded-full ${
                      transaction.status === 'completed' 
                        ? 'bg-green-500/20 text-green-400'
                        : transaction.status === 'pending'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Transaction Modal */}
      {showTransactionModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Add Transaction</h3>
              <button
                onClick={() => setShowTransactionModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">User</label>
                <div className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {selectedUser.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium">{selectedUser.email}</p>
                    <p className="text-sm text-slate-400">
                      Current balance: {selectedUser.wallet ? formatCurrency(selectedUser.wallet.balance) : 'No wallet'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Transaction Type</label>
                <select
                  value={transactionType}
                  onChange={(e) => setTransactionType(e.target.value as 'deposit' | 'withdrawal' | 'adjustment')}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="deposit">Deposit</option>
                  <option value="withdrawal">Withdrawal</option>
                  <option value="adjustment">Adjustment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Amount</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    step="0.01"
                    value={transactionAmount}
                    onChange={(e) => setTransactionAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <input
                  type="text"
                  value={transactionDescription}
                  onChange={(e) => setTransactionDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Optional description"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowTransactionModal(false)}
                  className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTransaction}
                  disabled={!transactionAmount}
                  className="flex-1 py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Transaction
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};