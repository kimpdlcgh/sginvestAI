import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  Check, 
  X, 
  Clock,
  TrendingUp,
  TrendingDown,
  User,
  Calendar,
  DollarSign
} from 'lucide-react';
import { AdminOrder } from '../../types/admin';
import { firebaseAdminService as adminService } from '../../services/firebaseAdminService';

interface OrderManagementProps {
  onRefresh: () => void;
}

export const OrderManagement: React.FC<OrderManagementProps> = ({ onRefresh }) => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'filled' | 'cancelled'>('all');
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const pendingOrders = await adminService.getPendingOrders();
      setOrders(pendingOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFillOrder = async (orderId: string) => {
    setProcessingOrder(orderId);
    try {
      const result = await adminService.fillOrder(orderId, 'admin'); // In real app, use actual admin ID
      
      if (result.success) {
        loadOrders();
        onRefresh();
      } else {
        alert(result.error || 'Failed to fill order');
      }
    } catch (error) {
      console.error('Error filling order:', error);
      alert('Failed to fill order');
    } finally {
      setProcessingOrder(null);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
      // In a real implementation, you'd have a cancel order method
      console.log('Cancelling order:', orderId);
      loadOrders();
      onRefresh();
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user_email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Order Management</h2>
          <p className="text-slate-400">Review and execute pending orders</p>
        </div>
        <div className="text-sm text-slate-400">
          {filteredOrders.length} orders
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by symbol or user email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'filled' | 'cancelled')}
          className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="filled">Filled</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    No orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                          order.type === 'buy' ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                          {order.type === 'buy' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{order.symbol}</div>
                          <div className="text-sm text-slate-400">{order.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <div className="text-sm text-white">{order.user_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-white">
                        {order.quantity} shares
                      </div>
                      <div className="text-sm text-slate-400">
                        {order.order_type} @ {formatCurrency(order.price || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white">
                        {formatCurrency(order.total)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === 'pending' 
                          ? 'bg-yellow-500/20 text-yellow-400' 
                          : order.status === 'filled'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {order.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                        {order.status === 'filled' && <Check className="w-3 h-3 mr-1" />}
                        {order.status === 'cancelled' && <X className="w-3 h-3 mr-1" />}
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {order.status === 'pending' && (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleFillOrder(order.id)}
                            disabled={processingOrder === order.id}
                            className="flex items-center space-x-1 px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Check className="w-3 h-3" />
                            <span>{processingOrder === order.id ? 'Filling...' : 'Fill'}</span>
                          </button>
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            className="flex items-center space-x-1 px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors"
                          >
                            <X className="w-3 h-3" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-slate-400">Pending Orders</span>
          </div>
          <p className="text-xl font-bold text-white">
            {orders.filter(o => o.status === 'pending').length}
          </p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-sm text-slate-400">Buy Orders</span>
          </div>
          <p className="text-xl font-bold text-white">
            {orders.filter(o => o.type === 'buy').length}
          </p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <span className="text-sm text-slate-400">Sell Orders</span>
          </div>
          <p className="text-xl font-bold text-white">
            {orders.filter(o => o.type === 'sell').length}
          </p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-slate-400">Total Value</span>
          </div>
          <p className="text-xl font-bold text-white">
            {formatCurrency(orders.reduce((sum, o) => sum + o.total, 0))}
          </p>
        </div>
      </div>
    </div>
  );
};