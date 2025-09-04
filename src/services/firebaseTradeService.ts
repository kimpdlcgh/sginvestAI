import { 
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Trade, firestoreConverter } from '../types/firestore';
import { firebasePortfolioService } from './firebasePortfolioService';
import { marketDataService } from './marketData';
import { firebaseWalletService } from './firebaseWalletService';

interface TradeOrder {
  symbol: string;
  name: string;
  type: 'buy' | 'sell';
  orderType: 'market' | 'limit' | 'stop';
  quantity: number;
  price?: number;
}

export class FirebaseTradeService {
  private tradesCollection = collection(db, 'trades').withConverter(firestoreConverter<Trade>());

  async executeTrade(userId: string, order: TradeOrder): Promise<{ success: boolean; trade?: Trade; error?: any }> {
    try {
      // Get current market price
      const quote = await marketDataService.getQuote(order.symbol);
      const executionPrice = order.orderType === 'market' ? quote.price : (order.price || quote.price);
      const total = order.quantity * executionPrice;

      // Check wallet balance for buy orders
      if (order.type === 'buy') {
        const hasSufficientFunds = await firebaseWalletService.checkSufficientFunds(userId, total);
        if (!hasSufficientFunds) {
          return { 
            success: false, 
            error: { message: 'Insufficient wallet balance for this purchase' } 
          };
        }
      }

      // For paper trading, execute immediately
      const status = order.orderType === 'market' ? 'executed' : 'pending';

      // Record the trade
      const tradeData = {
        userId,
        symbol: order.symbol,
        name: order.name,
        type: order.type,
        orderType: order.orderType,
        quantity: order.quantity,
        price: executionPrice,
        total,
        status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const tradeRef = await addDoc(this.tradesCollection, tradeData);

      // Update portfolio and wallet if trade is executed
      if (status === 'executed') {
        if (order.type === 'buy') {
          // Deduct from wallet
          await firebaseWalletService.updateWalletBalance(
            userId,
            -total,
            'trade_buy',
            `Buy ${order.quantity} shares of ${order.symbol}`,
            'user',
            tradeRef.id
          );

          // Add to portfolio
          await firebasePortfolioService.addToPortfolio(
            userId,
            order.symbol,
            order.name,
            order.quantity,
            executionPrice,
            'Technology' // Default sector
          );
        } else {
          // Remove from portfolio
          await firebasePortfolioService.removeFromPortfolio(
            userId,
            order.symbol,
            order.quantity
          );

          // Add to wallet
          await firebaseWalletService.updateWalletBalance(
            userId,
            total,
            'trade_sell',
            `Sell ${order.quantity} shares of ${order.symbol}`,
            'user',
            tradeRef.id
          );
        }
      }

      const tradeDoc = await getDoc(tradeRef);
      return { success: true, trade: tradeDoc.data() };
    } catch (error) {
      console.error('Error executing Firebase trade:', error);
      return { success: false, error };
    }
  }

  async getUserTrades(userId: string): Promise<Trade[]> {
    try {
      const tradesQuery = query(
        this.tradesCollection,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(tradesQuery);
      return querySnapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Error fetching Firebase user trades:', error);
      return [];
    }
  }

  async cancelTrade(userId: string, tradeId: string): Promise<{ success: boolean; error?: any }> {
    try {
      const tradeRef = doc(this.tradesCollection, tradeId);
      const tradeDoc = await getDoc(tradeRef);
      
      if (!tradeDoc.exists()) {
        return { success: false, error: { message: 'Trade not found' } };
      }

      const trade = tradeDoc.data();
      if (trade.userId !== userId) {
        return { success: false, error: { message: 'Unauthorized' } };
      }

      if (trade.status !== 'pending') {
        return { success: false, error: { message: 'Trade cannot be cancelled' } };
      }

      await updateDoc(tradeRef, {
        status: 'cancelled',
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      console.error('Error cancelling Firebase trade:', error);
      return { success: false, error };
    }
  }

  async getTradeHistory(userId: string, limitCount: number = 50): Promise<Trade[]> {
    try {
      const tradesQuery = query(
        this.tradesCollection,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(tradesQuery);
      return querySnapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Error fetching Firebase trade history:', error);
      return [];
    }
  }
}

export const firebaseTradeService = new FirebaseTradeService();