import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, ArrowUpDown, Loader2, AlertCircle, CreditCard, ExternalLink, CheckCircle, X } from 'lucide-react';
import { marketDataService } from '../services/marketData';
import { firebaseTradeService } from '../services/firebaseTradeService';
import { firebaseWalletService } from '../services/firebaseWalletService';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import { doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface TradingPanelProps {
  onTrade?: (trade: any) => void;
}

interface SearchResult {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  sector?: string;
}

export const TradingPanel: React.FC<TradingPanelProps> = ({ onTrade }) => {
  const { user } = useFirebaseAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<SearchResult | null>(null);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>('market');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(false);
  const [showFundingModal, setShowFundingModal] = useState(false);
  const [submittingFundingRequest, setSubmittingFundingRequest] = useState(false);

  useEffect(() => {
    if (user) {
      loadWalletBalance();
    }
  }, [user?.uid]);

  useEffect(() => {
    const searchAssets = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setSearchLoading(true);
      try {
        const results = await marketDataService.searchSymbols(searchQuery);
        const assetsWithPrices: SearchResult[] = [];
        
        // Get quotes for top 5 results
        for (const result of results.slice(0, 5)) {
          try {
            const quote = await marketDataService.getQuote(result.symbol);
            assetsWithPrices.push({
              symbol: result.symbol,
              name: result.name,
              price: quote.price,
              change: quote.change,
              changePercent: quote.changePercent,
              sector: quote.sector,
            });
          } catch (error) {
            console.error(`Error fetching quote for ${result.symbol}:`, error);
          }
        }
        
        setSearchResults(assetsWithPrices);
      } catch (error) {
        console.error('Error searching assets:', error);
        setError('Error searching assets');
      } finally {
        setSearchLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchAssets, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const loadWalletBalance = async () => {
    if (!user) return;
    
    setWalletLoading(true);
    try {
      const wallet = await firebaseWalletService.getUserWallet(user.uid);
      setWalletBalance(wallet?.balance || 0);
    } catch (error) {
      console.error('Error loading wallet balance:', error);
    } finally {
      setWalletLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const handleAssetSelect = (asset: SearchResult) => {
    setSelectedAsset(asset);
    setPrice(asset.price.toString());
    setShowOrderForm(true);
    setError('');
    setSuccess('');
  };

  const handleFundingRequest = async () => {
    if (!user || !selectedAsset || !quantity) return;

    setSubmittingFundingRequest(true);
    setError('');

    try {
      const totalCost = calculateTotal();
      
      // Create a Firebase funding request
      await addDoc(collection(db, 'fundingRequests'), {
        userId: user.uid,
        userEmail: user.email,
        requestedAmount: totalCost,
        status: 'pending',
        message: `User ${user.email} needs ${formatCurrency(totalCost)} to purchase ${quantity} shares of ${selectedAsset.symbol}. Current balance: ${formatCurrency(walletBalance)}, Shortfall: ${formatCurrency(totalCost - walletBalance)}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Show success notification with proper styling
      setSuccess(`Funding request sent! An admin will contact you with deposit instructions to add ${formatCurrency(totalCost - walletBalance)} to your wallet.`);
      setShowFundingModal(false);

      // Auto-hide success message after 8 seconds
      setTimeout(() => setSuccess(''), 8000);

    } catch (error) {
      console.error('Error sending funding request:', error);
      setError('Failed to send funding request. Please try again.');
    } finally {
      setSubmittingFundingRequest(false);
    }
  };

  const handleSubmitOrder = async () => {
    if (!selectedAsset || !quantity || !user) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Calculate total cost
      const totalCost = parseInt(quantity) * (orderType === 'market' ? selectedAsset.price : parseFloat(price));
      
      // Check wallet balance for buy orders
      if (tradeType === 'buy') {
        const hasSufficientFunds = await firebaseWalletService.checkSufficientFunds(user.uid, totalCost);
        if (!hasSufficientFunds) {
          setShowFundingModal(true);
          setLoading(false);
          return;
        }
      }

      const result = await firebaseTradeService.executeTrade(user.uid, {
        symbol: selectedAsset.symbol,
        name: selectedAsset.name,
        type: tradeType,
        orderType,
        quantity: parseInt(quantity),
        price: orderType === 'market' ? undefined : parseFloat(price),
      });

      if (result.success && result.trade) {
        setSuccess(`${tradeType === 'buy' ? 'Buy' : 'Sell'} order executed successfully!`);
        onTrade?.(result.trade);
        
        // Update wallet balance
        loadWalletBalance();
        
        // Reset form
        setQuantity('');
        setPrice(selectedAsset.price.toString());
        setShowOrderForm(false);
        setSelectedAsset(null);
        setSearchQuery('');
        setSearchResults([]);

        // Auto-hide success message after 5 seconds
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(result.error?.message || 'Failed to execute trade');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!quantity || !price) return 0;
    return parseInt(quantity) * parseFloat(price);
  };

  if (!user) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <div className="text-center py-8">
          <ArrowUpDown className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Sign In Required</h3>
          <p className="text-slate-400">Please sign in to start trading</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <ArrowUpDown className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Trading Panel</h2>
            <p className="text-sm text-slate-400">Search and execute trades</p>
          </div>
        </div>
        
        {/* Wallet Balance */}
        <div className="flex items-center space-x-2 px-4 py-2 bg-slate-700/50 rounded-lg">
          <div className="text-right">
            <p className="text-xs text-slate-400">Wallet Balance</p>
            <p className="text-sm font-bold text-white">
              {walletLoading ? 'Loading...' : formatCurrency(walletBalance)}
            </p>
          </div>
        </div>
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
                <h4 className="text-green-400 font-medium mb-1">Success!</h4>
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

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Section */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search stocks, ETFs, crypto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchLoading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 animate-spin" />
          )}
        </div>
      </div>

      {/* Search Results */}
      {searchQuery && searchResults.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Search Results</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {searchResults.map((asset) => (
              <div
                key={asset.symbol}
                onClick={() => handleAssetSelect(asset)}
                className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 cursor-pointer transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {asset.symbol.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{asset.symbol}</p>
                    <p className="text-sm text-slate-400">{asset.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-white">{formatCurrency(asset.price)}</p>
                  <div className="flex items-center space-x-1">
                    {asset.change >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                    <span className={`text-sm ${asset.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatPercent(asset.changePercent)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Form */}
      {showOrderForm && selectedAsset && (
        <div className="border border-slate-600/50 rounded-xl p-6 bg-slate-700/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Place Order</h3>
            <button
              onClick={() => setShowOrderForm(false)}
              className="text-slate-400 hover:text-white"
            >
              ×
            </button>
          </div>

          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              {selectedAsset.symbol.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-white">{selectedAsset.symbol}</p>
              <p className="text-sm text-slate-400">{selectedAsset.name}</p>
              <p className="text-sm text-white">{formatCurrency(selectedAsset.price)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <button
              onClick={() => setTradeType('buy')}
              className={`p-3 rounded-lg font-medium transition-all duration-200 ${
                tradeType === 'buy'
                  ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                  : 'bg-slate-700/50 border border-slate-600 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setTradeType('sell')}
              className={`p-3 rounded-lg font-medium transition-all duration-200 ${
                tradeType === 'sell'
                  ? 'bg-red-500/20 border border-red-500/50 text-red-400'
                  : 'bg-slate-700/50 border border-slate-600 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Sell
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Order Type</label>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as 'market' | 'limit' | 'stop')}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="market">Market Order</option>
                <option value="limit">Limit Order</option>
                <option value="stop">Stop Order</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Quantity</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  min="1"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Price {orderType === 'market' ? '(Market)' : ''}
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={orderType === 'market'}
                  step="0.01"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-700/30 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Estimated Total:</span>
                <span className="text-xl font-bold text-white">
                  {formatCurrency(calculateTotal())}
                </span>
              </div>
              
              {/* Wallet balance check */}
              {tradeType === 'buy' && (
                <div className="flex justify-between items-center mt-2 text-sm">
                  <span className="text-slate-400">Wallet Balance:</span>
                  <span className={`font-medium ${walletBalance >= calculateTotal() ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(walletBalance)}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={handleSubmitOrder}
              disabled={!quantity || !price || loading}
              className={`w-full py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                tradeType === 'buy'
                  ? 'bg-green-500 hover:bg-green-600 text-white disabled:bg-slate-600 disabled:text-slate-400'
                  : 'bg-red-500 hover:bg-red-600 text-white disabled:bg-slate-600 disabled:text-slate-400'
              }`}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>
                {loading ? 'Processing...' : `Place ${tradeType === 'buy' ? 'Buy' : 'Sell'} Order`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Funding Modal */}
      {showFundingModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <CreditCard className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Insufficient Funds</h3>
              </div>
              <button
                onClick={() => setShowFundingModal(false)}
                className="text-slate-400 hover:text-white"
                disabled={submittingFundingRequest}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm mb-2">
                  <strong>Insufficient wallet balance</strong>
                </p>
                <p className="text-slate-300 text-sm">
                  You need {formatCurrency(calculateTotal())} but only have {formatCurrency(walletBalance)} available.
                  <br />
                  <strong>Shortfall: {formatCurrency(calculateTotal() - walletBalance)}</strong>
                </p>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <h4 className="text-blue-400 font-medium mb-2">Need to add funds?</h4>
                <p className="text-slate-300 text-sm mb-3">
                  Request funding instructions from our team. An admin will contact you with secure deposit methods to cover the shortfall.
                </p>
                <div className="text-xs text-slate-400">
                  <p>• Bank transfer instructions</p>
                  <p>• Secure payment methods</p>
                  <p>• Fast processing (usually same day)</p>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowFundingModal(false)}
                  disabled={submittingFundingRequest}
                  className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFundingRequest}
                  disabled={submittingFundingRequest}
                  className="flex-1 py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {submittingFundingRequest ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      <span>Request Funding</span>
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