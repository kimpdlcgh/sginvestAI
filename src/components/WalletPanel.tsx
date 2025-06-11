import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Minus, 
  Clock, 
  RefreshCw,
  AlertCircle,
  Loader2,
  Activity
} from 'lucide-react';
import { walletService } from '../services/walletService';
import { useAuth } from '../hooks/useAuth';

interface WalletPanelProps {
  onRefresh?: () => void;
}

export const WalletPanel: React.FC<WalletPanelProps> = ({ onRefresh }) => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadWalletData();
    }
  }, [user]);

  const loadWalletData = async () => {
    if (!user) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Get wallet
      const userWallet = await walletService.getUserWallet(user.id);
      setWallet(userWallet);
      
      // If wallet exists, get transactions
      if (userWallet) {
        setTransactionsLoading(true);
        const walletTransactions = await walletService.getWalletTransactions(userWallet.id);
        setTransactions(walletTransactions);
        setTransactionsLoading(false);
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
      setError('Failed to load wallet data');
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

  if (!user) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <div className="text-center py-8">
          <Wallet className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Sign In Required</h3>
          <p className="text-slate-400">Please sign in to view your wallet</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <div className="text-center py-8">
          <Loader2 className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-semibold text-white mb-2">Loading Wallet</h3>
          <p className="text-slate-400">Please wait...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Error Loading Wallet</h3>
          <p className="text-slate-400">{error}</p>
          <button
            onClick={loadWalletData}
            className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <div className="text-center py-8">
          <Wallet className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Wallet Found</h3>
          <p className="text-slate-400 mb-4">You don't have a wallet yet. Contact support to create one.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Wallet className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Wallet</h2>
            <p className="text-sm text-slate-400">Manage your funds</p>
          </div>
        </div>
        <button
          onClick={loadWalletData}
          className="p-2 text-slate-400 hover:text-white transition-colors"
          title="Refresh wallet"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Wallet Balance Card */}
      <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-blue-400" />
            <span className="text-white font-medium">Available Balance</span>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            wallet.status === 'active' 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            {wallet.status}
          </span>
        </div>
        <div className="text-3xl font-bold text-white mb-2">
          {formatCurrency(wallet.balance)}
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-300">Currency: {wallet.currency}</span>
          <span className="text-slate-300">
            Last updated: {formatDate(wallet.updated_at)}
          </span>
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Transaction History</h3>
          <span className="text-sm text-slate-400">
            {transactions.length} transactions
          </span>
        </div>

        {transactionsLoading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 text-blue-400 mx-auto mb-4 animate-spin" />
            <p className="text-slate-400">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 bg-slate-700/30 rounded-lg">
            <Clock className="w-8 h-8 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    transaction.type.includes('buy') || transaction.type === 'withdrawal' || transaction.type === 'fee'
                      ? 'bg-red-500/20'
                      : transaction.type.includes('sell') || transaction.type === 'deposit'
                      ? 'bg-green-500/20'
                      : 'bg-blue-500/20'
                  }`}>
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div>
                    <p className="font-medium text-white capitalize">
                      {transaction.type.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-slate-400">
                      {transaction.description || 'No description'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${getTransactionColor(transaction.type)}`}>
                    {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatDate(transaction.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};