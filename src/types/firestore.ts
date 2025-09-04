import { Timestamp } from 'firebase/firestore';

// Firestore document interfaces
export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  primaryPhone?: string;
  secondaryPhone?: string;
  whatsappNumber?: string;
  emergencyContact?: string;
  primaryAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  language: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  numberFormat: string;
  weekStart: string;
  riskTolerance?: string;
  investmentExperience?: string;
  investmentHorizon?: string;
  annualIncome?: string;
  netWorth?: string;
  employmentStatus?: string;
  profileCompletion: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PortfolioHolding {
  id: string;
  userId: string;
  symbol: string;
  name: string;
  shares: number;
  averagePrice: number;
  currentPrice: number;
  sector: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Trade {
  id: string;
  userId: string;
  symbol: string;
  name: string;
  type: 'buy' | 'sell';
  orderType: 'market' | 'limit' | 'stop';
  quantity: number;
  price: number;
  total: number;
  status: 'executed' | 'pending' | 'cancelled';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  availableBalance: number;
  pendingBalance: number;
  currency: string;
  status: 'active' | 'suspended' | 'frozen';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: 'deposit' | 'withdrawal' | 'trade_buy' | 'trade_sell' | 'fee' | 'adjustment';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description?: string;
  referenceId?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  createdAt: Timestamp;
  createdBy?: string;
}

export interface FundingRequest {
  id: string;
  userId: string;
  userEmail: string;
  requestedAmount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  message?: string;
  adminNotes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Watchlist {
  id: string;
  userId: string;
  name: string;
  symbols: string[];
  isDefault: boolean;
  createdAt: Timestamp;
}

// Firestore converter utilities
export const firestoreConverter = <T>() => ({
  toFirestore: (data: T): any => {
    // Convert any Date objects to Timestamps
    const converted: any = {};
    Object.entries(data as any).forEach(([key, value]) => {
      if (value instanceof Date) {
        converted[key] = Timestamp.fromDate(value);
      } else if (key.endsWith('At') && typeof value === 'string') {
        // Convert ISO string dates to Timestamps
        converted[key] = Timestamp.fromDate(new Date(value));
      } else {
        converted[key] = value;
      }
    });
    return converted;
  },
  fromFirestore: (snapshot: any): T => {
    const data = snapshot.data();
    if (!data) return data;
    
    // Convert Timestamps back to Dates/strings as needed
    Object.entries(data).forEach(([key, value]) => {
      if (value && typeof value.toDate === 'function') {
        // Convert Timestamp to Date or ISO string based on usage
        if (key.endsWith('At')) {
          data[key] = value.toDate();
        }
      }
    });
    
    return { id: snapshot.id, ...data } as T;
  },
});