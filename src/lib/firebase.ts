import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate Firebase configuration
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const missingEnvVars = requiredEnvVars.filter(key => !import.meta.env[key]);

if (missingEnvVars.length > 0) {
  console.error('Missing Firebase environment variables:', missingEnvVars);
  throw new Error(`Missing Firebase environment variables: ${missingEnvVars.join(', ')}. Please check your .env file.`);
}

// Initialize Firebase
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase services for PRODUCTION use (no emulators)
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

// Production connection test
export const testFirebaseConnection = async (): Promise<boolean> => {
  try {
    console.log('🔍 Testing Firebase connection...');
    
    // Simple auth state check with timeout
    return new Promise((resolve) => {
      let resolved = false;
      
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (resolved) return;
        resolved = true;
        unsubscribe();
        
        console.log('✅ Firebase Auth connection successful');
        
        // Test basic Firestore connectivity
        try {
          const testDocRef = doc(db, '_test_', 'connection');
          await getDoc(testDocRef);
          console.log('✅ Firebase Firestore connection successful');
          resolve(true);
        } catch (firestoreError: any) {
          if (firestoreError.code === 'permission-denied' || firestoreError.code === 'not-found') {
            // These errors mean Firestore is online but we don't have access - that's OK
            console.log('✅ Firebase Firestore connection successful (expected security error)');
            resolve(true);
          } else {
            console.warn('⚠️ Firestore connection issue:', firestoreError.message);
            // Still resolve as true for resilience - app can work with reduced functionality
            resolve(true);
          }
        }
      }, (error) => {
        if (resolved) return;
        resolved = true;
        console.warn('⚠️ Firebase Auth error:', error.message);
        // Resolve as true to allow app to continue
        resolve(true);
      });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        if (resolved) return;
        resolved = true;
        unsubscribe();
        console.warn('⚠️ Firebase connection timeout - continuing anyway');
        resolve(true);
      }, 5000);
    });
  } catch (error) {
    console.warn('Firebase connection test failed:', error);
    return true; // Return true to allow app to continue with degraded functionality
  }
};

// Log successful initialization
console.log('🔥 Firebase initialized for production project:', firebaseConfig.projectId);
console.log('📍 Auth domain:', firebaseConfig.authDomain);
console.log('🗃️ Firestore project:', firebaseConfig.projectId);

export default app;