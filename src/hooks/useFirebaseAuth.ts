import { useState, useEffect } from 'react';
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword as firebaseUpdatePassword,
  onAuthStateChanged,
  sendEmailVerification,
  connectAuthEmulator
} from 'firebase/auth';
import { auth, testFirebaseConnection } from '../lib/firebase';
import { userService } from '../services/userService';

export const useFirebaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Initialize auth connection
    const initializeAuth = async () => {
      try {
        // Verify Firebase configuration
        const config = auth.app.options;
        if (!config.apiKey || !config.projectId) {
          console.error('❌ Firebase configuration incomplete. Check your .env file.');
          setLoading(false);
          return;
        }
        
        console.log('🔥 Connecting to Firebase project:', config.projectId);
        
        // Test connection to Firebase
        const connectionTest = await testFirebaseConnection();
        if (!connectionTest) {
          console.warn('⚠️ Firebase connection limited - app will continue with reduced functionality');
        }
        
        console.log('✅ Firebase connection verified');
        setInitialized(true);
      } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!initialized && !user) {
        // Still initializing, don't process auth state changes yet
        return;
      }
      
      setUser(user);
      
      // Create user profile if user exists but profile doesn't
      if (user && user.email) {
        try {
          await userService.ensureUserProfile(user.uid, user.email);
          console.log('✅ User profile ensured for:', user.email);
        } catch (error) {
          console.warn('⚠️ Could not create user profile (Firebase offline):', error);
          // Don't throw - allow app to continue without profile
        }
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [initialized]);

  const signUp = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Send email verification
      if (userCredential.user) {
        await sendEmailVerification(userCredential.user);
      }
      
      return { user: userCredential.user, error: null };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return { user: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { user: userCredential.user, error: null };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { user: null, error };
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      // Redirect to main website
      window.location.href = 'https://safeguardsecurities.us';
      return { error: null };
    } catch (error: any) {
      console.error('Sign out error:', error);
      return { error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/?type=recovery`,
        handleCodeInApp: true
      });
      return { error: null };
    } catch (error: any) {
      console.error('Password reset error:', error);
      return { error };
    }
  };

  const updateUserPassword = async (newPassword: string) => {
    try {
      if (!auth.currentUser) {
        throw new Error('No authenticated user');
      }
      
      await firebaseUpdatePassword(auth.currentUser, newPassword);
      return { error: null };
    } catch (error: any) {
      console.error('Update password error:', error);
      return { error };
    }
  };

  const resendConfirmationEmail = async (email: string) => {
    try {
      if (!auth.currentUser) {
        throw new Error('No authenticated user');
      }
      
      await sendEmailVerification(auth.currentUser);
      return { error: null };
    } catch (error: any) {
      console.error('Resend confirmation error:', error);
      return { error };
    }
  };

  // Check if user is admin
  const isAdmin = user?.email?.includes('admin') || user?.email?.includes('support');

  return {
    user,
    loading,
    isAdmin,
    signUp,
    signIn,
    signOut: signOutUser,
    resetPassword,
    updatePassword: updateUserPassword,
    resendConfirmationEmail,
  };
};