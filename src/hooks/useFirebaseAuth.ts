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
import { auth } from '../lib/firebase';
import { userService } from '../services/userService';

export const useFirebaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Initialize auth connection
    const initializeAuth = async () => {
      try {
        // For production: verify connection to live Firebase
        console.log('🔥 Connecting to Firebase Auth:', auth.config.apiKey ? 'Live Project' : 'Not configured');
        
        if (!auth.config.apiKey) {
          console.error('❌ Firebase API key not configured. Check your .env file.');
          setLoading(false);
          return;
        }
        
        console.log('✅ Firebase Auth initialized for project:', auth.app.options.projectId);
        setInitialized(true);
      } catch (error) {
        console.error('❌ Firebase Auth initialization failed:', error);
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
          console.error('Error creating user profile:', error);
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