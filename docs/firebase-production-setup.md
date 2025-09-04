# Firebase Production Setup Guide

## 🔥 Complete Firebase Live Project Setup

This guide walks you through setting up your investment dashboard to connect directly to your live Firebase project (not emulators).

---

## 1. Firebase Console Configuration

### Step 1: Access Your Project Settings
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click on your project
3. Click the **⚙️ Settings** icon → **Project settings**

### Step 2: Get Web App Configuration
1. Scroll down to **Your apps** section
2. If no web app exists:
   - Click **Add app** → **Web** (`</>` icon)
   - App nickname: `investai-dashboard`
   - ✅ Check "Also set up Firebase Hosting"
   - Click **Register app**

3. Copy the **Firebase configuration object**:
```javascript
const firebaseConfig = {
  apiKey: "AIza...", 
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

### Step 3: Enable Authentication
1. Navigate to **Authentication** → **Sign-in method**
2. Enable **Email/Password**:
   - Click **Email/Password** provider
   - Toggle **Enable**
   - Toggle **Email link (passwordless sign-in)** if desired
   - Click **Save**

3. Configure **Authorized domains**:
   - Add your production domain: `yourdomain.com`
   - Add development domain: `localhost` (should already be there)
   - Click **Add domain** if needed

### Step 4: Set Up Firestore Database
1. Go to **Firestore Database** → **Create database**
2. Choose **Start in production mode**
3. Select database location (closest to your users)
4. Click **Done**

### Step 5: Deploy Security Rules
1. Go to **Firestore Database** → **Rules**
2. Replace the default rules with the production rules provided in this setup
3. Click **Publish**

---

## 2. Environment Configuration

### Create Your .env File
Create a `.env` file in your project root with your Firebase config:

```env
# Firebase Configuration (Replace with your actual values)
VITE_FIREBASE_API_KEY=AIzaSyDOv5CoRtu1e0gg9yxrTCPTXhhThZGE188
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Market Data APIs (Optional)
VITE_FINNHUB_API_KEY=your_finnhub_api_key
VITE_ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key
```

### Where to Find Each Value:

**API Key** (`apiKey`):
- Firebase Console → Project Settings → General → Web API Key

**Auth Domain** (`authDomain`):
- Format: `your-project-id.firebaseapp.com`
- Found in: Project Settings → General → Project ID

**Project ID** (`projectId`):
- Firebase Console → Project Settings → General → Project ID

**Storage Bucket** (`storageBucket`):
- Firebase Console → Project Settings → General → Default Cloud Storage bucket

**Messaging Sender ID** (`messagingSenderId`):
- Firebase Console → Project Settings → Cloud Messaging → Sender ID

**App ID** (`appId`):
- Firebase Console → Project Settings → Your apps → App ID

---

## 3. Security Best Practices

### API Key Security
✅ **Firebase API keys are safe to expose** in client-side code
- They identify your project, not authenticate users
- Security is handled by Firestore rules and Auth
- However, restrict API key usage in production:

1. Go to **Google Cloud Console** → **APIs & Services** → **Credentials**
2. Find your Firebase API key
3. Click **Edit** and add **Application restrictions**:
   - **HTTP referrers**: Add your domain
   - **API restrictions**: Restrict to Firebase APIs only

### Database Security Rules
The provided `firestore.rules` file includes:
- User data isolation (users can only access their own data)
- Admin access patterns (emails containing 'admin' or 'support')
- Public read access for market data
- Input validation and sanitization

### Authentication Security
1. **Enable Email Verification** (Production):
   - Authentication → Settings → User actions
   - Toggle **Email verification**

2. **Password Policy**:
   - Authentication → Settings → Password policy
   - Set minimum requirements

---

## 4. Testing Your Setup

### Connection Test
Your app includes a connection test. After setup, check the browser console for:
```
🔥 Firebase initialized for production project: your-project-id
📍 Auth domain: your-project.firebaseapp.com
🗃️ Firestore project: your-project-id
```

### Verify Authentication
1. Try signing up with a new account
2. Check Firebase Console → Authentication → Users
3. Verify new user appears in the list

### Verify Database
1. After signing up, check Firestore Database → Data
2. You should see collections: `profiles`, `wallets`, `watchlists`
3. Verify data is properly secured (try accessing from another account)

---

## 5. Production Deployment

### Deploy Security Rules
```bash
# Install Firebase CLI locally
npm install -D firebase-tools

# Login to Firebase (one-time setup)
npx firebase login

# Initialize Firestore
npx firebase init firestore

# Deploy rules
npx firebase deploy --only firestore:rules
```

### Deploy App to Firebase Hosting
```bash
# Build your app
npm run build

# Deploy to Firebase Hosting
npx firebase deploy --only hosting
```

---

## 6. Troubleshooting Common Issues

### ❌ "Firebase: Error (auth/network-request-failed)"
**Cause**: Incorrect configuration or missing environment variables
**Solution**:
1. Verify all environment variables are set correctly
2. Check `.env` file is in project root
3. Restart development server: `npm run dev`
4. Verify Firebase project is active in console

### ❌ "Firebase: Error (auth/api-key-not-valid)"
**Cause**: Invalid or expired API key
**Solution**:
1. Go to Firebase Console → Project Settings → Web apps
2. Copy the latest config object
3. Update your `.env` file with new values
4. Restart development server

### ❌ "FirebaseError: Missing or insufficient permissions"
**Cause**: Security rules are too restrictive or not deployed
**Solution**:
1. Go to Firestore Database → Rules in Firebase Console
2. Deploy the security rules provided in this setup
3. Check that user is properly authenticated
4. Verify user IDs match in security rules

### ❌ "Firebase: Error (auth/unauthorized-domain)"
**Cause**: Domain not in authorized domains list
**Solution**:
1. Go to Authentication → Settings → Authorized domains
2. Add your domain (production) and `localhost` (development)
3. Save changes

### ❌ Connection works in development but fails in production
**Cause**: Environment variables not set in production environment
**Solution**:
1. Add environment variables to your hosting platform
2. For Firebase Hosting: Use `firebase functions:config:set`
3. For other hosts: Add variables in hosting dashboard

---

## 7. Firebase Console Quick Links

Once your project is set up, bookmark these useful links:

- **Authentication Users**: `https://console.firebase.google.com/project/YOUR_PROJECT_ID/authentication/users`
- **Firestore Data**: `https://console.firebase.google.com/project/YOUR_PROJECT_ID/firestore/data`
- **Security Rules**: `https://console.firebase.google.com/project/YOUR_PROJECT_ID/firestore/rules`
- **Usage Analytics**: `https://console.firebase.google.com/project/YOUR_PROJECT_ID/analytics`
- **Project Settings**: `https://console.firebase.google.com/project/YOUR_PROJECT_ID/settings/general`

---

## 8. Environment Variables Checklist

✅ Copy this template and fill in your values:

```env
# Get these from Firebase Console → Project Settings → General
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Optional: Market Data APIs
VITE_FINNHUB_API_KEY=
VITE_ALPHA_VANTAGE_API_KEY=
```

---

## 9. Success Indicators

When everything is working correctly, you should see:

✅ **Console Logs**:
```
🔥 Firebase initialized for production project: your-project-id
📍 Auth domain: your-project.firebaseapp.com  
🗃️ Firestore project: your-project-id
```

✅ **Authentication**: Users can sign up and sign in successfully

✅ **Database**: User data appears in Firestore collections

✅ **Security**: Users can only see their own data

✅ **Real-time**: Data updates automatically across browser tabs

---

## 🚨 Important Notes

1. **Remove Emulator Code**: The updated `firebase.ts` removes all emulator connections
2. **Production Ready**: This configuration connects directly to your live Firebase project
3. **Secure**: Security rules prevent unauthorized data access
4. **Scalable**: Firebase auto-scales with your user base
5. **Real-time**: All data updates happen in real-time across devices

Your investment dashboard is now configured to use your live Firebase project with enterprise-grade security and performance! 🚀