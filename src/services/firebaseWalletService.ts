import { 
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Wallet, WalletTransaction, firestoreConverter } from '../types/firestore';

export class FirebaseWalletService {
  private walletsCollection = collection(db, 'wallets').withConverter(firestoreConverter<Wallet>());
  private transactionsCollection = collection(db, 'walletTransactions').withConverter(firestoreConverter<WalletTransaction>());

  async getUserWallet(userId: string): Promise<Wallet | null> {
    try {
      const walletRef = doc(this.walletsCollection, userId);
      const walletDoc = await getDoc(walletRef);
      return walletDoc.exists() ? walletDoc.data() : null;
    } catch (error) {
      console.error('Error fetching Firebase wallet:', error);
      return null;
    }
  }

  async createWallet(userId: string, initialBalance: number = 1000): Promise<Wallet> {
    try {
      const walletData = {
        userId,
        balance: initialBalance,
        availableBalance: initialBalance,
        pendingBalance: 0,
        currency: 'USD',
        status: 'active' as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const walletRef = doc(this.walletsCollection, userId);
      await setDoc(walletRef, walletData);

      // Create initial transaction if balance > 0
      if (initialBalance > 0) {
        await this.addTransaction(userId, {
          type: 'deposit',
          amount: initialBalance,
          description: 'Initial wallet funding',
          createdBy: 'system',
          balanceBefore: 0,
          balanceAfter: initialBalance,
        });
      }

      return { id: userId, ...walletData } as Wallet;
    } catch (error) {
      console.error('Error creating Firebase wallet:', error);
      throw error;
    }
  }

  async updateWalletBalance(
    userId: string,
    amount: number,
    type: 'deposit' | 'withdrawal' | 'trade_buy' | 'trade_sell' | 'fee' | 'adjustment',
    description: string,
    createdBy: string = 'system',
    referenceId?: string
  ): Promise<{ success: boolean; newBalance?: number; error?: string }> {
    try {
      return await runTransaction(db, async (transaction) => {
        const walletRef = doc(this.walletsCollection, userId);
        const walletDoc = await transaction.get(walletRef);
        
        let wallet: Wallet;
        
        if (!walletDoc.exists()) {
          // Create wallet if it doesn't exist
          wallet = await this.createWallet(userId, 0);
        } else {
          wallet = walletDoc.data();
        }

        const currentBalance = wallet.balance;
        const newBalance = currentBalance + amount;

        // Check for sufficient funds on withdrawals/purchases
        if ((type === 'withdrawal' || type === 'trade_buy' || type === 'fee') && newBalance < 0) {
          throw new Error('Insufficient funds');
        }

        // Update wallet balance
        transaction.update(walletRef, {
          balance: newBalance,
          availableBalance: newBalance,
          updatedAt: serverTimestamp(),
        });

        // Add transaction record
        await this.addTransaction(userId, {
          type,
          amount,
          description,
          referenceId,
          createdBy,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
        });

        return { success: true, newBalance };
      });
    } catch (error) {
      console.error('Error updating Firebase wallet balance:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async addTransaction(
    userId: string,
    transaction: Partial<WalletTransaction>
  ): Promise<WalletTransaction> {
    try {
      const transactionData = {
        walletId: userId, // Using userId as walletId for simplicity
        ...transaction,
        status: transaction.status || 'completed',
        createdAt: serverTimestamp(),
      };

      const transactionRef = await addDoc(this.transactionsCollection, transactionData);
      const transactionDoc = await getDoc(transactionRef);
      
      return transactionDoc.data()!;
    } catch (error) {
      console.error('Error adding Firebase wallet transaction:', error);
      throw error;
    }
  }

  async getWalletTransactions(
    userId: string,
    limitCount: number = 50
  ): Promise<WalletTransaction[]> {
    try {
      const transactionsQuery = query(
        this.transactionsCollection,
        where('walletId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(transactionsQuery);
      return querySnapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Error fetching Firebase wallet transactions:', error);
      return [];
    }
  }

  async checkSufficientFunds(userId: string, amount: number): Promise<boolean> {
    try {
      const wallet = await this.getUserWallet(userId);
      return wallet ? wallet.availableBalance >= amount : false;
    } catch (error) {
      console.error('Error checking sufficient funds:', error);
      return false;
    }
  }
}

export const firebaseWalletService = new FirebaseWalletService();