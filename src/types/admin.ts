export interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  profile?: UserProfile;
  wallet?: Wallet;
  stats?: UserStats;
}

export interface UserProfile {
  first_name?: string;
  last_name?: string;
  phone?: string;
  risk_tolerance?: string;
  investment_experience?: string;
  employment_status?: string;
  profile_completion: number;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  available_balance: number;
  pending_balance: number;
  currency: string;
  status: 'active' | 'suspended' | 'frozen';
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  type: 'deposit' | 'withdrawal' | 'trade_buy' | 'trade_sell' | 'fee' | 'adjustment';
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string;
  reference_id?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  created_by?: string;
}

export interface AdminOrder {
  id: string;
  user_id: string;
  symbol: string;
  name: string;
  type: 'buy' | 'sell';
  order_type: 'market' | 'limit' | 'stop';
  quantity: number;
  price?: number;
  total: number;
  status: 'pending' | 'executed' | 'cancelled';
  created_at: string;
  updated_at?: string;
  filled_at?: string;
  created_by?: string;
  user_email?: string;
}

export interface UserStats {
  total_portfolio_value: number;
  total_trades: number;
  total_deposits: number;
  total_withdrawals: number;
  profit_loss: number;
  profit_loss_percent: number;
}

export interface AdminStats {
  total_users: number;
  active_users: number;
  total_wallet_balance: number;
  total_trades_today: number;
  pending_orders: number;
  pending_funding_requests?: number;
  total_volume_today: number;
}

export interface FundingRequest {
  id: string;
  user_id: string;
  user_email: string;
  requested_amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  message?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}