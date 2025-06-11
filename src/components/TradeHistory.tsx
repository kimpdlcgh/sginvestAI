import React, { useState, useEffect } from 'react';
import { Clock, Filter, Download, TrendingUp, TrendingDown, Search, Loader2 } from 'lucide-react';
import { tradeService } from '../services/tradeService';
import { useAuth } from '../hooks/useAuth';

interface Trade {
  id: string;
  user_id: string;
  symbol: string;
  name: string;
  type: 'buy' | 'sell';
  order_type: 'market' | 'limit' | 'stop';
  quantity: number;
  price: number;
  total: number;
  status: 'executed' | 'pending' | 'cancelled';
  created_at: string;
  updated_at: string;
}

interface TradeHistoryProps {
  refreshTrigger?: number;
}

export const TradeHistory: React.FC<TradeHistoryProps> = ({ refreshTrigger }) => {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'executed' | 'pending' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'symbol' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (user) {
      loadTrades();
    }
  }, [user, refreshTrigger]);

  const loadTrades = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userTrades = await tradeService.getUserTrades(user.id);
      setTrades(userTrades);
    } catch (error) {
      console.error('Error loading trades:', error);
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
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const filteredTrades = trades
    .filter(trade => {
      if (filter !== 'all' && trade.type !== filter) return false;
      if (statusFilter !== 'all' && trade.status !== statusFilter) return false;
      if (searchQuery && !trade.symbol.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !trade.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'symbol':
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        case 'amount':
          comparison = a.total - b.total;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'executed':
        return 'text-green-400 bg-green-500/20';
      case 'pending':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'cancelled':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-slate-400 bg-slate-500/20';
    }
  };

  const totalBuyValue = filteredTrades
    .filter(trade => trade.type === 'buy' && trade.status === 'executed')
    .reduce((sum, trade) => sum + trade.total, 0);

  const totalSellValue = filteredTrades
    .filter(trade => trade.type === 'sell' && trade.status === 'executed')
    .reduce((sum, trade) => sum + trade.total, 0);

  if (!user) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Sign In Required</h3>
          <p className="text-slate-400">Please sign in to view your trade history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Clock className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Trade History</h2>
            <p className="text-sm text-slate-400">Track all your trading activity</p>
          </div>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors">
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-slate-700/30 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-sm text-slate-400">Total Bought</span>
          </div>
          <p className="text-xl font-bold text-green-400">{formatCurrency(totalBuyValue)}</p>
        </div>
        <div className="p-4 bg-slate-700/30 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <span className="text-sm text-slate-400">Total Sold</span>
          </div>
          <p className="text-xl font-bold text-red-400">{formatCurrency(totalSellValue)}</p>
        </div>
        <div className="p-4 bg-slate-700/30 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-slate-400">Total Trades</span>
          </div>
          <p className="text-xl font-bold text-white">{filteredTrades.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search trades..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as 'all' | 'buy' | 'sell')}
          className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Types</option>
          <option value="buy">Buy Orders</option>
          <option value="sell">Sell Orders</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'executed' | 'pending' | 'cancelled')}
          className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="executed">Executed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [newSortBy, newSortOrder] = e.target.value.split('-');
            setSortBy(newSortBy as 'date' | 'symbol' | 'amount');
            setSortOrder(newSortOrder as 'asc' | 'desc');
          }}
          className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
          <option value="symbol-asc">Symbol A-Z</option>
          <option value="symbol-desc">Symbol Z-A</option>
          <option value="amount-desc">Highest Amount</option>
          <option value="amount-asc">Lowest Amount</option>
        </select>
      </div>

      {/* Trade List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 text-blue-400 mx-auto mb-4 animate-spin" />
            <p className="text-slate-400">Loading trades...</p>
          </div>
        ) : filteredTrades.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400">No trades found matching your criteria</p>
          </div>
        ) : (
          filteredTrades.map((trade) => (
            <div
              key={trade.id}
              className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-all duration-200"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {trade.symbol.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="font-semibold text-white">{trade.symbol}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      trade.type === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {trade.type.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trade.status)}`}>
                      {trade.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">{trade.name}</p>
                  <p className="text-xs text-slate-500">
                    {trade.quantity} shares @ {formatCurrency(trade.price)} • {trade.order_type}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${trade.type === 'buy' ? 'text-red-400' : 'text-green-400'}`}>
                  {trade.type === 'buy' ? '-' : '+'}{formatCurrency(trade.total)}
                </p>
                <p className="text-sm text-slate-400">{formatDate(trade.created_at)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};