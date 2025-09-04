import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Search, 
  Filter, 
  Check, 
  X, 
  Clock,
  DollarSign,
  User,
  Calendar,
  Mail,
  MessageSquare,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Loader2,
  Edit
} from 'lucide-react';
import { firebaseAdminService as adminService } from '../../services/firebaseAdminService';
import { FundingRequest } from '../../types/admin';

interface FundingRequestsManagementProps {
  onRefresh: () => void;
}

export const FundingRequestsManagement: React.FC<FundingRequestsManagementProps> = ({ onRefresh }) => {
  const [requests, setRequests] = useState<FundingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'completed'>('all');
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<FundingRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [processingDeposit, setProcessingDeposit] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadFundingRequests();
  }, []);

  const loadFundingRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await adminService.getPendingFundingRequests();
      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading funding requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId: string, newStatus: 'approved' | 'rejected' | 'completed') => {
    setProcessingRequest(requestId);
    try {
      const result = await adminService.updateFundingRequest(requestId, newStatus);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update funding request');
      }

      // Refresh the list
      loadFundingRequests();
      onRefresh();
      
      setSuccess(`Request ${newStatus} successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating funding request:', error);
      setError('Failed to update funding request');
      setTimeout(() => setError(''), 3000);
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleCompleteWithDeposit = async () => {
    if (!selectedRequest || !depositAmount) return;
    
    setProcessingDeposit(true);
    setError('');
    
    try {
      const amount = parseFloat(depositAmount);
      
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid deposit amount');
      }
      
      // 1. Add funds to user's wallet
      const result = await adminService.updateUserWallet(
        selectedRequest.user_id,
        amount,
        'deposit',
        adminNotes || `Funding request #${selectedRequest.id.slice(0, 8)} approved`,
        'admin'
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update wallet');
      }
      
      // 2. Mark funding request as completed
      await adminService.updateFundingRequest(
        selectedRequest.id,
        'completed',
        adminNotes
      );
      
      // 3. Refresh data
      loadFundingRequests();
      onRefresh();
      
      // 4. Show success message and close modal
      setSuccess(`Successfully deposited ${formatCurrency(amount)} to user's wallet`);
      setShowDepositModal(false);
      setSelectedRequest(null);
      setAdminNotes('');
      setDepositAmount('');
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error processing deposit:', error);
      setError(error.message || 'Failed to process deposit');
    } finally {
      setProcessingDeposit(false);
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (request.message && request.message.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'approved':
        return 'text-blue-400 bg-blue-500/20';
      case 'completed':
        return 'text-green-400 bg-green-500/20';
      case 'rejected':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-3 h-3" />;
      case 'approved':
        return <CheckCircle className="w-3 h-3" />;
      case 'completed':
        return <Check className="w-3 h-3" />;
      case 'rejected':
        return <X className="w-3 h-3" />;
      default:
        return <AlertCircle className="w-3 h-3" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Funding Requests</h2>
          <p className="text-slate-400">Review and process user funding requests</p>
        </div>
        <div className="text-sm text-slate-400">
          {filteredRequests.length} requests
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-green-400">{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-400">{error}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by email or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-slate-400">Pending</span>
          </div>
          <p className="text-xl font-bold text-white">
            {requests.filter(r => r.status === 'pending').length}
          </p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-slate-400">Approved</span>
          </div>
          <p className="text-xl font-bold text-white">
            {requests.filter(r => r.status === 'approved').length}
          </p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-sm text-slate-400">Completed</span>
          </div>
          <p className="text-xl font-bold text-white">
            {requests.filter(r => r.status === 'completed').length}
          </p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-slate-400">Total Requested</span>
          </div>
          <p className="text-xl font-bold text-white">
            {formatCurrency(requests.reduce((sum, r) => sum + r.requested_amount, 0))}
          </p>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Message</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading funding requests...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No funding requests found
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {request.user_email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{request.user_email}</div>
                          <div className="text-sm text-slate-400">ID: {request.user_id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white">
                        {formatCurrency(request.requested_amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1 capitalize">{request.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-300 max-w-xs truncate" title={request.message}>
                        {request.message || 'No message provided'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {formatDate(request.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {request.status === 'pending' && (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleUpdateStatus(request.id, 'approved')}
                            disabled={processingRequest === request.id}
                            className="flex items-center space-x-1 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(request.id, 'rejected')}
                            disabled={processingRequest === request.id}
                            className="flex items-center space-x-1 px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                          >
                            <X className="w-3 h-3" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                      {request.status === 'approved' && (
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setDepositAmount(request.requested_amount.toString());
                            setShowDepositModal(true);
                          }}
                          disabled={processingRequest === request.id}
                          className="flex items-center space-x-1 px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                        >
                          <DollarSign className="w-3 h-3" />
                          <span>Process Deposit</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Instructions for Admins */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <CreditCard className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <h3 className="text-blue-400 font-medium mb-2">Admin Instructions</h3>
            <div className="text-slate-300 text-sm space-y-2">
              <p><strong>Workflow:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li><strong>Review:</strong> Check the user's request details and amount</li>
                <li><strong>Approve:</strong> Click "Approve" to authorize the funding request</li>
                <li><strong>Contact User:</strong> Send deposit instructions via email to the user</li>
                <li><strong>Process Deposit:</strong> Once payment is received, click "Process Deposit" to add funds to the user's wallet</li>
              </ol>
              <p className="mt-3"><strong>Note:</strong> Approved requests require manual follow-up to send payment instructions to users.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Process Deposit</h3>
              </div>
              <button
                onClick={() => {
                  setShowDepositModal(false);
                  setSelectedRequest(null);
                  setAdminNotes('');
                  setDepositAmount('');
                }}
                className="text-slate-400 hover:text-white"
                disabled={processingDeposit}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center space-x-3 mb-2">
                  <User className="w-4 h-4 text-blue-400" />
                  <p className="text-white font-medium">{selectedRequest.user_email}</p>
                </div>
                <div className="flex items-center space-x-3 mb-2">
                  <CreditCard className="w-4 h-4 text-blue-400" />
                  <p className="text-white font-medium">Requested: {formatCurrency(selectedRequest.requested_amount)}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <p className="text-slate-300 text-sm">{formatDate(selectedRequest.created_at)}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Deposit Amount</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">Enter the actual amount received from the user</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Admin Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add notes about the transaction (optional)"
                  rows={3}
                ></textarea>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowDepositModal(false);
                    setSelectedRequest(null);
                    setAdminNotes('');
                    setDepositAmount('');
                  }}
                  disabled={processingDeposit}
                  className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompleteWithDeposit}
                  disabled={!depositAmount || processingDeposit || parseFloat(depositAmount) <= 0}
                  className="flex-1 py-3 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {processingDeposit ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Complete Deposit</span>
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