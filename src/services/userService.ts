import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, firestoreConverter } from '../types/firestore';

class UserService {
  private profilesCollection = collection(db, 'profiles').withConverter(firestoreConverter<UserProfile>());
  private walletsCollection = collection(db, 'wallets');
  private watchlistsCollection = collection(db, 'watchlists');

  async ensureUserProfile(userId: string, email: string): Promise<UserProfile> {
    try {
      const profileRef = doc(this.profilesCollection, userId);
      const profileDoc = await getDoc(profileRef);

      if (!profileDoc.exists()) {
        // Create new profile
        const newProfile: Omit<UserProfile, 'id'> = {
          email,
          language: 'English (US)',
          timezone: 'America/New_York (EST)',
          currency: 'USD',
          dateFormat: 'MM/DD/YYYY',
          numberFormat: 'US',
          weekStart: 'Sunday',
          profileCompletion: 0,
          createdAt: serverTimestamp() as any,
          updatedAt: serverTimestamp() as any,
        };

        await setDoc(profileRef, newProfile);

        // Create default wallet
        await this.createDefaultWallet(userId);
        
        // Create default watchlist
        await this.createDefaultWatchlist(userId);

        return { id: userId, ...newProfile } as UserProfile;
      }

      return profileDoc.data();
    } catch (error) {
      console.error('Error ensuring user profile:', error);
      throw error;
    }
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const profileRef = doc(this.profilesCollection, userId);
      const profileDoc = await getDoc(profileRef);
      return profileDoc.exists() ? profileDoc.data() : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const profileRef = doc(this.profilesCollection, userId);
      await updateDoc(profileRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  private async createDefaultWallet(userId: string): Promise<void> {
    try {
      const walletRef = doc(this.walletsCollection, userId);
      await setDoc(walletRef, {
        userId,
        balance: 1000, // Starting balance for demo
        availableBalance: 1000,
        pendingBalance: 0,
        currency: 'USD',
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error creating default wallet:', error);
    }
  }

  private async createDefaultWatchlist(userId: string): Promise<void> {
    try {
      const watchlistRef = doc(this.watchlistsCollection);
      await setDoc(watchlistRef, {
        userId,
        name: 'My Watchlist',
        symbols: ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA'],
        isDefault: true,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error creating default watchlist:', error);
    }
  }

  async getAllUsers(): Promise<any[]> {
    try {
      const profilesQuery = query(this.profilesCollection);
      const querySnapshot = await getDocs(profilesQuery);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  async searchUsers(searchQuery: string): Promise<any[]> {
    try {
      // Note: Firestore doesn't have full-text search like PostgreSQL
      // For production, consider using Algolia or Elasticsearch
      const profilesQuery = query(
        this.profilesCollection,
        where('email', '>=', searchQuery.toLowerCase()),
        where('email', '<=', searchQuery.toLowerCase() + '\uf8ff')
      );
      
      const querySnapshot = await getDocs(profilesQuery);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }
}

export const userService = new UserService();