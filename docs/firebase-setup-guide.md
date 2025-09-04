# Firebase Setup Guide

## Overview

This guide explains how to set up Firebase for your investment dashboard. The app has been converted from Supabase to Firebase, offering excellent real-time capabilities, scalable authentication, and robust security.

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Enter project name: `investai-dashboard` (or your preferred name)
4. Enable Google Analytics (optional)
5. Click "Create project"

## 2. Enable Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable **Email/Password** provider
3. Configure authorized domains:
   - Add your production domain
   - `localhost` is enabled by default for development

## 3. Create Firestore Database

1. Go to **Firestore Database**
2. Click "Create database"
3. Choose **Start in test mode** (we'll deploy security rules later)
4. Select your preferred location (closest to your users)

## 4. Set Up Web App

1. Go to **Project Settings** → **General**
2. Scroll to "Your apps" section
3. Click **Web app** icon (`</>`)
4. Register app with nickname: `investai-web`
5. Copy the Firebase configuration object

## 5. Environment Variables

Create a `.env` file in your project root:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Market Data APIs (unchanged)
VITE_FINNHUB_API_KEY=your_finnhub_api_key
VITE_ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key
```

## 6. Deploy Firestore Security Rules

The app includes comprehensive Firestore security rules in `firestore.rules`. To deploy them:

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init firestore` (select existing project)
4. Deploy rules: `firebase deploy --only firestore:rules`

## 7. Deploy Firestore Indexes

Deploy the database indexes for optimal query performance:

```bash
firebase deploy --only firestore:indexes
```

## Key Firebase Features Implemented

### ✅ **Authentication**
- Email/password authentication
- Password reset functionality
- User profile creation
- Session management

### ✅ **Database (Firestore)**
- User profiles and settings
- Portfolio holdings tracking
- Trade history and orders
- Wallet management
- Funding requests
- Admin functionality

### ✅ **Real-time Updates**
- Live portfolio price updates
- Real-time trade execution
- Instant wallet balance updates
- Live admin notifications

### ✅ **Security**
- Comprehensive Firestore security rules
- Role-based access control (users vs admins)
- Data validation and sanitization
- Secure admin functions

## Database Structure

### Collections:
- **profiles** - User profile information
- **portfolioHoldings** - Individual asset holdings
- **trades** - Complete trade history
- **wallets** - User wallet balances
- **walletTransactions** - Transaction history
- **fundingRequests** - User funding requests
- **watchlists** - User watchlists
- **adminOrders** - Admin-created orders
- **assets** - Market asset data

## Security Rules Features

- **User Isolation**: Users can only access their own data
- **Admin Access**: Admins can manage all user data
- **Role Detection**: Automatic admin detection via email pattern
- **Data Validation**: Server-side validation of all writes
- **Real-time Security**: Rules enforced on all real-time updates

## Admin Access

Admin users are identified by email patterns:
- Any email containing "admin" → Admin access
- Any email containing "support" → Admin access
- Example: `admin@yourdomain.com` or `support@example.com`

## Testing Your Setup

1. **Start development server**: `npm run dev`
2. **Test authentication**: Try signing up with a new account
3. **Test trading**: Execute a sample trade
4. **Test admin functions**: Sign in with admin email
5. **Check Firestore**: View data in Firebase Console

## Firebase vs Supabase Comparison

| Feature | Firebase | Supabase (Previous) |
|---------|----------|---------------------|
| **Database** | Firestore (NoSQL) | PostgreSQL (Relational) |
| **Real-time** | Native real-time | Real-time subscriptions |
| **Authentication** | Firebase Auth | Supabase Auth |
| **Security** | Firestore Rules | Row Level Security (RLS) |
| **Scalability** | Auto-scaling | Manual scaling |
| **Pricing** | Pay-as-you-go | Generous free tier |
| **Offline Support** | Excellent | Limited |

## Advantages of Firebase

✅ **Real-time by default** - All data updates automatically
✅ **Offline support** - App works without internet connection
✅ **Auto-scaling** - Handles growth automatically
✅ **Global CDN** - Fast worldwide performance
✅ **Rich ecosystem** - Analytics, Crashlytics, Performance monitoring
✅ **Strong security** - Google-grade security infrastructure

## Production Deployment

For production deployment:

1. **Build the app**: `npm run build`
2. **Deploy to Firebase Hosting**: `firebase deploy --only hosting`
3. **Configure custom domain**: Firebase Console → Hosting → Custom domain
4. **Enable monitoring**: Firebase Console → Performance, Crashlytics
5. **Set up backup**: Firestore → Import/Export

## Monitoring and Analytics

Firebase provides excellent monitoring tools:
- **Authentication**: User sign-in analytics
- **Database**: Query performance and usage
- **Hosting**: CDN performance and traffic
- **Crashlytics**: Error tracking and reporting
- **Performance**: App performance monitoring

## Migration Benefits

🚀 **Better Performance** - Firestore's real-time capabilities provide instant updates
🔒 **Enhanced Security** - Firestore security rules are more granular
📱 **Offline Support** - Users can view data even without internet
🌐 **Global Scale** - Firebase auto-scales worldwide
📊 **Better Analytics** - Built-in performance and usage analytics
🔧 **Easier Maintenance** - Less configuration and maintenance overhead

The Firebase conversion maintains all the original functionality while adding improved real-time capabilities and better scalability for your investment dashboard!