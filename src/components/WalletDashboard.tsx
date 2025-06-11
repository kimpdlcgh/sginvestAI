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
  Activity,
  CreditCard,
  ExternalLink,
  CheckCircle,
  Info,
  X
} from 'lucide-react';
import { walletService } from '../services/walletService';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

export const WalletDashboard: React.FC = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showFundingModal, setShowFundingModal] = useState(false);
  const [requestAmount, setRequestAmount] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

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

  const handleFundingRequest = async () => {
    if (!user || !requestAmount) return;

    setSubmittingRequest(true);
    setError('');

    try {
      // Create a funding request notification for admin
      const { error } = await supabase
        .from('funding_requests')
        .insert({
          user_id: user.id,
          user_email: user.email,
          requested_amount: parseFloat(requestAmount),
          status: 'pending',
          message: `User ${user.email} is requesting ${formatCurrency(parseFloat(requestAmount))} wallet funding`
        });

      if (error) {
        console.error('Error creating funding request:', error);
        setError('Failed to send funding request. Please try again.');
        return;
      }

      // Show success notification with proper styling
      setSuccess(`Your funding request for ${formatCurrency(parseFloat(requestAmount))} has been submitted successfully! An admin will contact you with deposit instructions within 24 hours.`);
      setShowFundingModal(false);
      setRequestAmount('');

      // Auto-hide success message after 10 seconds
      setTimeout(() => {
        setSuccess('');
      }, 10000);

    } catch (error) {
      console.error('Error sending funding request:', error);
      setError('Failed to send funding request. Please try again.');
    } finally {
      setSubmittingRequest(false);
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
      <div className="space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Wallet</h1>
          <p className="text-slate-400">Manage your funds and view transaction history</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <div className="text-center py-8">
            <Wallet className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Sign In Required</h3>
            <p className="text-slate-400">Please sign in to view your wallet</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Wallet</h1>
          <p className="text-slate-400">Manage your funds and view transaction history</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold text-white mb-2">Loading Wallet</h3>
            <p className="text-slate-400">Please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !success) {
    return (
      <div className="space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Wallet</h1>
          <p className="text-slate-400">Manage your funds and view transaction history</p>
        </div>
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
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Wallet</h1>
        <p className="text-slate-400">Manage your funds and view transaction history</p>
      </div>

      {/* Success Toast Notification */}
      {success && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className="bg-green-500/10 backdrop-blur-sm border border-green-500/20 rounded-xl p-4 shadow-lg">
            <div className="flex items-start space-x-3">
              <div className="p-1 bg-green-500/20 rounded-full">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-green-400 font-medium mb-1">Request Submitted!</h4>
                <p className="text-slate-300 text-sm">{success}</p>
              </div>
              <button
                onClick={() => setSuccess('')}
                className="text-green-400 hover:text-green-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-red-400 font-medium">Request Failed</p>
            <p className="text-slate-300 text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={() => setError('')}
            className="text-red-400 hover:text-red-300 ml-auto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Wallet Balance Card */}
      <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Wallet className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Your Wallet</h2>
              <p className="text-slate-300">Available balance</p>
            </div>
          </div>
          <button
            onClick={loadWalletData}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            title="Refresh wallet"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-4xl font-bold text-white mb-2">
              {wallet ? formatCurrency(wallet.balance) : formatCurrency(0)}
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                wallet?.status === 'active' 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {wallet?.status || 'No wallet'}
              </span>
              <span className="text-slate-300">
                Currency: {wallet?.currency || 'USD'}
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <button
              onClick={() => setShowFundingModal(true)}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add Funds</span>
            </button>
            <p className="text-xs text-slate-400 mt-2 text-center">
              Request funding instructions from our team
            </p>
          </div>
        </div>
      </div>

      {/* Information Card */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <h3 className="text-white font-medium mb-2">How to Add Funds</h3>
            <div className="text-slate-300 text-sm space-y-1">
              <p>• Click "Add Funds" to request deposit instructions</p>
              <p>• Our team will contact you with secure payment methods</p>
              <p>• Funds are typically processed within 24 hours</p>
              <p>• Supported methods: Bank transfer, wire transfer, and more</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Transaction History</h3>
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
            <p className="text-slate-500 text-sm mt-1">Your transaction history will appear here</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
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

      {/* Funding Request Modal */}
      {showFundingModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CreditCard className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Request Funding</h3>
              </div>
              <button
                onClick={() => setShowFundingModal(false)}
                className="text-slate-400 hover:text-white"
                disabled={submittingRequest}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <h4 className="text-blue-400 font-medium mb-2">How it works</h4>
                <div className="text-slate-300 text-sm space-y-1">
                  <p>1. Tell us how much you'd like to deposit</p>
                  <p>2. We'll send you secure payment instructions</p>
                  <p>3. Complete the transfer using your preferred method</p>
                  <p>4. Funds appear in your wallet within 24 hours</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Amount to deposit
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="10"
                    value={requestAmount}
                    onChange={(e) => setRequestAmount(e.target.value)}
                    disabled={submittingRequest}
                    className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    placeholder="100.00"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">Minimum deposit: $10.00</p>
              </div>

              <div className="p-3 bg-slate-700/30 rounded-lg">
                <p className="text-slate-300 text-sm">
                  <strong>Secure & Safe:</strong> All transactions are processed through encrypted, 
                  bank-grade security systems. Your financial information is never stored on our servers.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowFundingModal(false)}
                  disabled={submittingRequest}
                  className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFundingRequest}
                  disabled={!requestAmount || parseFloat(requestAmount) < 10 || submittingRequest}
                  className="flex-1 py-3 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {submittingRequest ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      <span>Send Request</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};