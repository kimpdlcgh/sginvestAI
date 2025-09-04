import React, { useState, useEffect } from 'react';
import { Plus, Search, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { firebaseAdminService as adminService } from '../../services/firebaseAdminService';
import { marketDataService } from '../../services/marketData';
import { User } from '../../types/admin';

interface CreateOrderModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({ onClose, onSuccess }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const allUsers = await adminService.getAllUsers(100);
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleSymbolSearch = async () => {
    if (!symbol) return;

    try {
      const quote = await marketDataService.getQuote(symbol.toUpperCase());
      setName(quote.name);
      setPrice(quote.price.toString());
    } catch (error) {
      console.error('Error fetching symbol data:', error);
      setError('Symbol not found');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      setError('Please select a user');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await adminService.createOrderForUser(
        selectedUser.id,
        {
          symbol: symbol.toUpperCase(),
          name: name || symbol.toUpperCase(),
          type,
          order_type: orderType,
          quantity: parseInt(quantity),
          price: orderType === 'limit' ? parseFloat(price) : undefined
        },
        'admin' // In real app, use actual admin ID
      );

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      setError('Failed to create order');
    } finally {
      setLoading(false);
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

  const calculateTotal = () => {
    if (!quantity || !price) return 0;
    return parseInt(quantity) * parseFloat(price);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Plus className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Create Order for User</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Select User</label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="max-h-32 overflow-y-auto bg-slate-700/30 rounded-lg border border-slate-600">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`p-3 cursor-pointer transition-colors ${
                    selectedUser?.id === user.id 
                      ? 'bg-blue-500/20 border-blue-500/30' 
                      : 'hover:bg-slate-700/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white text-sm">{user.email}</p>
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Type Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Order Type</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setType('buy')}
                className={`p-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                  type === 'buy'
                    ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                    : 'bg-slate-700/50 border border-slate-600 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Buy</span>
              </button>
              <button
                type="button"
                onClick={() => setType('sell')}
                className={`p-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                  type === 'sell'
                    ? 'bg-red-500/20 border border-red-500/50 text-red-400'
                    : 'bg-slate-700/50 border border-slate-600 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <TrendingDown className="w-4 h-4" />
                <span>Sell</span>
              </button>
            </div>
          </div>

          {/* Symbol */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Symbol</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="AAPL"
                required
              />
              <button
                type="button"
                onClick={handleSymbolSearch}
                className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Company Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Apple Inc."
              required
            />
          </div>

          {/* Order Type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Execution Type</label>
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value as 'market' | 'limit')}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="market">Market Order</option>
              <option value="limit">Limit Order</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Quantity</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="100"
                min="1"
                required
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Price {orderType === 'market' ? '(Market)' : ''}
              </label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={orderType === 'market'}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Total */}
          {quantity && price && (
            <div className="p-4 bg-slate-700/30 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Estimated Total:</span>
                <span className="text-xl font-bold text-white">
                  {formatCurrency(calculateTotal())}
                </span>
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedUser || !symbol || !quantity || !price}
              className="flex-1 py-3 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Creating...' : 'Create Order'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};