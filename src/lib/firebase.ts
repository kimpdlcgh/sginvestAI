import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
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
    
    // Test connection by checking auth state
    return new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged(() => {
        console.log('✅ Firebase Auth connection successful');
        unsubscribe();
        resolve(true);
      });
      
      // Timeout after 10 seconds
      setTimeout(() => {
        console.warn('⚠️ Firebase connection timeout');
        unsubscribe();
        resolve(false);
      }, 10000);
    });
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return false;
  }
};

// Log successful initialization
console.log('🔥 Firebase initialized for production project:', firebaseConfig.projectId);
console.log('📍 Auth domain:', firebaseConfig.authDomain);
console.log('🗃️ Firestore project:', firebaseConfig.projectId);

export default app;