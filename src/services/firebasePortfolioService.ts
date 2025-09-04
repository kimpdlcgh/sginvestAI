import { 
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PortfolioHolding, firestoreConverter } from '../types/firestore';
import { marketDataService } from './marketData';
import { Asset, PortfolioStats } from '../types';

export class FirebasePortfolioService {
  private holdingsCollection = collection(db, 'portfolioHoldings').withConverter(firestoreConverter<PortfolioHolding>());

  async getUserPortfolio(userId: string): Promise<Asset[]> {
    try {
      console.log('🔍 Fetching Firebase portfolio for user:', userId);
      
      const holdingsQuery = query(
        this.holdingsCollection,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(holdingsQuery);
      const holdings = querySnapshot.docs.map(doc => doc.data());

      console.log(`📊 Found ${holdings.length} portfolio holdings`);

      // If no holdings, return empty array
      if (holdings.length === 0) {
        return [];
      }

      // Get current prices for all holdings
      const assets: Asset[] = [];
      for (const holding of holdings) {
        try {
          const quote = await marketDataService.getQuote(holding.symbol);
          
          const currentValue = holding.shares * quote.price;
          const totalCost = holding.shares * holding.averagePrice;
          const change = currentValue - totalCost;
          const changePercent = totalCost > 0 ? (change / totalCost) * 100 : 0;

          assets.push({
            id: holding.id,
            symbol: holding.symbol,
            name: holding.name,
            price: quote.price,
            change: quote.change,
            changePercent: quote.changePercent,
            shares: holding.shares,
            value: currentValue,
            allocation: 0, // Will be calculated after all assets are loaded
            sector: holding.sector,
          });
        } catch (error) {
          console.warn(`⚠️ Error fetching quote for ${holding.symbol}:`, error.message);
          // Use stored data as fallback
          const currentValue = holding.shares * holding.currentPrice;
          assets.push({
            id: holding.id,
            symbol: holding.symbol,
            name: holding.name,
            price: holding.currentPrice,
            change: 0,
            changePercent: 0,
            shares: holding.shares,
            value: currentValue,
            allocation: 0,
            sector: holding.sector,
          });
        }
      }

      // Calculate allocations
      const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
      assets.forEach(asset => {
        asset.allocation = totalValue > 0 ? (asset.value / totalValue) * 100 : 0;
      });

      console.log(`✅ Successfully processed ${assets.length} portfolio assets`);
      return assets;
    } catch (error) {
      console.error('❌ Error fetching Firebase portfolio:', error);
      throw error;
    }
  }

  async getPortfolioStats(userId: string): Promise<PortfolioStats> {
    try {
      console.log('📈 Calculating Firebase portfolio stats for user:', userId);
      
      const assets = await this.getUserPortfolio(userId);
      const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
      
      // Get holdings for cost basis calculation
      const holdingsQuery = query(
        this.holdingsCollection,
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(holdingsQuery);
      const holdings = querySnapshot.docs.map(doc => doc.data());

      const totalCost = holdings.reduce((sum, holding) => 
        sum + (holding.shares * holding.averagePrice), 0);

      const totalGain = totalValue - totalCost;
      const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

      // Calculate day change (simplified - would need historical data for accuracy)
      const dayChange = assets.reduce((sum, asset) => 
        sum + (asset.change * asset.shares), 0);
      const dayChangePercent = totalValue > 0 ? (dayChange / totalValue) * 100 : 0;

      const stats = {
        totalValue,
        totalGain,
        totalGainPercent,
        dayChange,
        dayChangePercent,
      };

      console.log('✅ Firebase portfolio stats calculated:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error calculating Firebase portfolio stats:', error);
      return {
        totalValue: 0,
        totalGain: 0,
        totalGainPercent: 0,
        dayChange: 0,
        dayChangePercent: 0,
      };
    }
  }

  async addToPortfolio(
    userId: string, 
    symbol: string, 
    name: string, 
    shares: number, 
    price: number, 
    sector: string
  ): Promise<{ success: boolean; error?: any }> {
    try {
      console.log(`➕ Adding to Firebase portfolio: ${shares} shares of ${symbol} at $${price}`);
      
      // Check if user already owns this stock
      const existingQuery = query(
        this.holdingsCollection,
        where('userId', '==', userId),
        where('symbol', '==', symbol)
      );
      
      const querySnapshot = await getDocs(existingQuery);
      
      if (!querySnapshot.empty) {
        // Update existing holding
        const existingDoc = querySnapshot.docs[0];
        const existing = existingDoc.data();
        
        const newShares = existing.shares + shares;
        const newAveragePrice = ((existing.shares * existing.averagePrice) + (shares * price)) / newShares;

        console.log(`📊 Updating existing position: ${existing.shares} + ${shares} = ${newShares} shares`);

        await updateDoc(doc(this.holdingsCollection, existingDoc.id), {
          shares: newShares,
          averagePrice: newAveragePrice,
          currentPrice: price,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Create new holding
        console.log(`🆕 Creating new Firebase portfolio holding for ${symbol}`);
        
        const newHoldingRef = doc(this.holdingsCollection);
        await setDoc(newHoldingRef, {
          userId,
          symbol,
          name,
          shares,
          averagePrice: price,
          currentPrice: price,
          sector: sector || 'Technology',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      console.log('✅ Successfully added to Firebase portfolio');
      return { success: true };
    } catch (error) {
      console.error('❌ Error adding to Firebase portfolio:', error);
      return { success: false, error };
    }
  }

  async removeFromPortfolio(
    userId: string, 
    symbol: string, 
    shares: number
  ): Promise<{ success: boolean; error?: any }> {
    try {
      console.log(`➖ Removing from Firebase portfolio: ${shares} shares of ${symbol}`);
      
      // Find existing holding
      const existingQuery = query(
        this.holdingsCollection,
        where('userId', '==', userId),
        where('symbol', '==', symbol)
      );
      
      const querySnapshot = await getDocs(existingQuery);
      
      if (querySnapshot.empty) {
        throw new Error('Position not found');
      }

      const existingDoc = querySnapshot.docs[0];
      const existing = existingDoc.data();

      if (shares >= existing.shares) {
        // Remove entire position
        console.log(`🗑️ Removing entire Firebase position for ${symbol}`);
        await deleteDoc(doc(this.holdingsCollection, existingDoc.id));
      } else {
        // Reduce position
        console.log(`📉 Reducing position: ${existing.shares} - ${shares} = ${existing.shares - shares} shares`);
        
        await updateDoc(doc(this.holdingsCollection, existingDoc.id), {
          shares: existing.shares - shares,
          updatedAt: serverTimestamp(),
        });
      }

      console.log('✅ Successfully removed from Firebase portfolio');
      return { success: true };
    } catch (error) {
      console.error('❌ Error removing from Firebase portfolio:', error);
      return { success: false, error };
    }
  }

  async updatePortfolioPrices(userId: string): Promise<{ success: boolean; error?: any }> {
    try {
      console.log('🔄 Updating Firebase portfolio prices for user:', userId);
      
      const holdingsQuery = query(
        this.holdingsCollection,
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(holdingsQuery);
      const holdings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (holdings.length === 0) {
        console.log('📭 No Firebase portfolio holdings to update');
        return { success: true };
      }

      const batch = writeBatch(db);
      let updatedCount = 0;

      for (const holding of holdings) {
        try {
          const quote = await marketDataService.getQuote(holding.symbol);
          
          const holdingRef = doc(this.holdingsCollection, holding.id);
          batch.update(holdingRef, {
            currentPrice: quote.price,
            updatedAt: serverTimestamp(),
          });
          
          updatedCount++;
        } catch (error) {
          console.warn(`⚠️ Error updating price for ${holding.symbol}:`, error.message);
        }
      }

      await batch.commit();

      console.log(`✅ Updated Firebase prices for ${updatedCount}/${holdings.length} holdings`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating Firebase portfolio prices:', error);
      return { success: false, error };
    }
  }
}

export const firebasePortfolioService = new FirebasePortfolioService();