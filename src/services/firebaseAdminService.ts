import { 
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { User, AdminOrder, AdminStats, UserStats, FundingRequest } from '../types/admin';
import { firebaseWalletService } from './firebaseWalletService';
import { marketDataService } from './marketData';
import { userService } from './userService';

export class FirebaseAdminService {
  private usersCollection = collection(db, 'profiles');
  private tradesCollection = collection(db, 'trades');
  private holdingsCollection = collection(db, 'portfolioHoldings');
  private fundingRequestsCollection = collection(db, 'fundingRequests');

  async getAllUsers(limitCount: number = 50, offset: number = 0): Promise<User[]> {
    try {
      // Note: Firebase doesn't have built-in pagination like Supabase
      // This is a simplified version - for production, implement cursor-based pagination
      const usersQuery = query(
        this.usersCollection,
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(usersQuery);
      const profiles = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Get wallets for these users
      const users: User[] = [];
      for (const profile of profiles) {
        try {
          const wallet = await firebaseWalletService.getUserWallet(profile.id);
          const stats = await this.getUserStats(profile.id);

          users.push({
            id: profile.id,
            email: profile.email,
            created_at: profile.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            last_sign_in_at: null, // Firebase doesn't track this by default
            email_confirmed_at: profile.createdAt?.toDate?.()?.toISOString(), // Assuming confirmed
            profile,
            wallet,
            stats,
          });
        } catch (error) {
          console.warn(`Error fetching user data for ${profile.id}:`, error);
        }
      }

      return users;
    } catch (error) {
      console.error('Error fetching Firebase users:', error);
      return [];
    }
  }

  async createUser(email: string, password: string, initialBalance: number = 0): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      // Create profile will be handled by the auth state change listener
      // Create wallet if initial balance > 0
      if (initialBalance > 0) {
        await firebaseWalletService.createWallet(userId, initialBalance);
      }

      // Get the complete user data
      const user = await this.getUserById(userId);
      
      return { success: true, user: user || undefined };
    } catch (error) {
      console.error('Error creating Firebase user:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      const [profile, wallet, stats] = await Promise.all([
        userService.getUserProfile(userId),
        firebaseWalletService.getUserWallet(userId),
        this.getUserStats(userId)
      ]);

      if (!profile) return null;

      return {
        id: userId,
        email: profile.email,
        created_at: profile.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        last_sign_in_at: null,
        email_confirmed_at: profile.createdAt?.toDate?.()?.toISOString(),
        profile,
        wallet,
        stats,
      };
    } catch (error) {
      console.error('Error fetching Firebase user:', error);
      return null;
    }
  }

  async updateUserWallet(
    userId: string,
    amount: number,
    type: 'deposit' | 'withdrawal' | 'adjustment',
    description: string,
    adminId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await firebaseWalletService.updateWalletBalance(
        userId,
        amount,
        type,
        description,
        adminId
      );

      return result;
    } catch (error) {
      console.error('Error updating Firebase user wallet:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async createOrderForUser(
    userId: string,
    order: {
      symbol: string;
      name: string;
      type: 'buy' | 'sell';
      order_type: 'market' | 'limit';
      quantity: number;
      price?: number;
    },
    adminId: string
  ): Promise<{ success: boolean; order?: AdminOrder; error?: string }> {
    try {
      // Get current market price if not provided
      let executionPrice = order.price;
      if (order.order_type === 'market' || !executionPrice) {
        const quote = await marketDataService.getQuote(order.symbol);
        executionPrice = quote.price;
      }

      const total = order.quantity * executionPrice;

      // Check wallet balance for buy orders
      if (order.type === 'buy') {
        const hasFunds = await firebaseWalletService.checkSufficientFunds(userId, total);
        if (!hasFunds) {
          return { success: false, error: 'Insufficient wallet balance' };
        }
      }

      // Create the order
      const orderData = {
        userId,
        symbol: order.symbol,
        name: order.name,
        type: order.type,
        orderType: order.order_type,
        quantity: order.quantity,
        price: executionPrice,
        total,
        status: 'pending',
        createdAt: serverTimestamp(),
        createdBy: adminId,
      };

      const orderRef = await addDoc(collection(db, 'adminOrders'), orderData);
      const orderDoc = await getDoc(orderRef);

      const adminOrder: AdminOrder = {
        id: orderRef.id,
        user_id: userId,
        symbol: order.symbol,
        name: order.name,
        type: order.type,
        order_type: order.order_type,
        quantity: order.quantity,
        price: executionPrice,
        total,
        status: 'pending',
        created_at: new Date().toISOString(),
        created_by: adminId,
      };

      return { success: true, order: adminOrder };
    } catch (error) {
      console.error('Error creating Firebase order for user:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async getPendingOrders(): Promise<AdminOrder[]> {
    try {
      const ordersQuery = query(
        collection(db, 'trades'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(ordersQuery);
      
      const orders: AdminOrder[] = [];
      for (const doc of querySnapshot.docs) {
        const trade = doc.data();
        
        // Get user profile for email
        const userProfile = await userService.getUserProfile(trade.userId);
        
        orders.push({
          id: doc.id,
          user_id: trade.userId,
          symbol: trade.symbol,
          name: trade.name,
          type: trade.type,
          order_type: trade.orderType,
          quantity: trade.quantity,
          price: trade.price,
          total: trade.total,
          status: trade.status,
          created_at: trade.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          created_by: 'admin',
          user_email: userProfile?.email || 'Unknown',
        });
      }

      return orders;
    } catch (error) {
      console.error('Error fetching Firebase pending orders:', error);
      return [];
    }
  }

  async getPendingFundingRequests(): Promise<{ data: FundingRequest[] | null; error: any }> {
    try {
      const requestsQuery = query(
        this.fundingRequestsCollection,
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(requestsQuery);
      const requests = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FundingRequest[];

      return { data: requests, error: null };
    } catch (error) {
      console.error('Error fetching Firebase funding requests:', error);
      return { data: null, error };
    }
  }

  async updateFundingRequest(
    requestId: string,
    status: 'approved' | 'rejected' | 'completed',
    adminNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const requestRef = doc(this.fundingRequestsCollection, requestId);
      await updateDoc(requestRef, {
        status,
        updatedAt: serverTimestamp(),
        adminNotes,
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating Firebase funding request:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async getAdminStats(): Promise<AdminStats> {
    try {
      const [usersSnapshot, walletsSnapshot, tradesSnapshot] = await Promise.all([
        getDocs(collection(db, 'profiles')),
        getDocs(collection(db, 'wallets')),
        getDocs(query(collection(db, 'trades'), where('createdAt', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000))))
      ]);

      const totalUsers = usersSnapshot.size;
      
      let totalWalletBalance = 0;
      walletsSnapshot.docs.forEach(doc => {
        const wallet = doc.data();
        totalWalletBalance += wallet.balance || 0;
      });

      let totalVolumeToday = 0;
      const tradesData = tradesSnapshot.docs.map(doc => doc.data());
      tradesData.forEach(trade => {
        totalVolumeToday += trade.total || 0;
      });

      const pendingOrders = tradesData.filter(trade => trade.status === 'pending').length;
      
      // Get pending funding requests count
      const fundingRequestsSnapshot = await getDocs(
        query(this.fundingRequestsCollection, where('status', '==', 'pending'))
      );

      return {
        total_users: totalUsers,
        active_users: totalUsers,
        total_wallet_balance: totalWalletBalance,
        total_trades_today: tradesData.length,
        pending_orders: pendingOrders,
        pending_funding_requests: fundingRequestsSnapshot.size,
        total_volume_today: totalVolumeToday
      };
    } catch (error) {
      console.error('Error fetching Firebase admin stats:', error);
      return {
        total_users: 0,
        active_users: 0,
        total_wallet_balance: 0,
        total_trades_today: 0,
        pending_orders: 0,
        pending_funding_requests: 0,
        total_volume_today: 0
      };
    }
  }

  async getUserStats(userId: string): Promise<UserStats> {
    try {
      const [holdingsSnapshot, tradesSnapshot, transactionsSnapshot] = await Promise.all([
        getDocs(query(this.holdingsCollection, where('userId', '==', userId))),
        getDocs(query(this.tradesCollection, where('userId', '==', userId))),
        getDocs(query(collection(db, 'walletTransactions'), where('walletId', '==', userId)))
      ]);

      const holdings = holdingsSnapshot.docs.map(doc => doc.data());
      const trades = tradesSnapshot.docs.map(doc => doc.data());
      const transactions = transactionsSnapshot.docs.map(doc => doc.data());

      const totalPortfolioValue = holdings.reduce((sum, h) => sum + (h.shares * h.currentPrice), 0);
      const totalCost = holdings.reduce((sum, h) => sum + (h.shares * h.averagePrice), 0);
      const profitLoss = totalPortfolioValue - totalCost;
      const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

      const deposits = transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0);
      const withdrawals = transactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + Math.abs(t.amount), 0);

      return {
        total_portfolio_value: totalPortfolioValue,
        total_trades: trades.length,
        total_deposits: deposits,
        total_withdrawals: withdrawals,
        profit_loss: profitLoss,
        profit_loss_percent: profitLossPercent
      };
    } catch (error) {
      console.error('Error fetching Firebase user stats:', error);
      return {
        total_portfolio_value: 0,
        total_trades: 0,
        total_deposits: 0,
        total_withdrawals: 0,
        profit_loss: 0,
        profit_loss_percent: 0
      };
    }
  }

  async fillOrder(orderId: string, adminId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // This would be implemented similar to the Supabase version
      // but using Firestore transactions for atomic operations
      
      const orderRef = doc(db, 'trades', orderId);
      const orderDoc = await getDoc(orderRef);

      if (!orderDoc.exists()) {
        return { success: false, error: 'Order not found' };
      }

      const order = orderDoc.data();
      if (order.status !== 'pending') {
        return { success: false, error: 'Order is not pending' };
      }

      // Execute the trade logic here...
      await updateDoc(orderRef, {
        status: 'executed',
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      console.error('Error filling Firebase order:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

export const firebaseAdminService = new FirebaseAdminService();