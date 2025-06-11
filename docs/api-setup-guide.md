# API Setup Guide - Quick Fix

## Immediate Fix for API Errors

The application is showing API errors because the Finnhub API key is invalid or missing. Here's how to fix it:

### Option 1: Get a Free Finnhub API Key (Recommended)

1. **Sign up for Finnhub**: Go to [https://finnhub.io/](https://finnhub.io/)
2. **Create free account**: Click "Get free API key"
3. **Get your API key**: Copy the API key from your dashboard
4. **Add to .env file**: Open your `.env` file and add:
   ```
   VITE_FINNHUB_API_KEY=your_actual_api_key_here
   ```
5. **Restart server**: Run `npm run dev` to restart your development server

### Option 2: Use Alpha Vantage (Alternative)

If you prefer Alpha Vantage:

1. **Sign up**: Go to [https://www.alphavantage.co/support/#api-key](https://www.alphavantage.co/support/#api-key)
2. **Get free API key**: Sign up for free account
3. **Add to .env file**:
   ```
   VITE_ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here
   ```

### Option 3: Disable API Calls (Development Only)

If you just want to test the app without real market data:

1. **Open** `src/services/marketData.ts`
2. **Find** the `getQuote` method
3. **Comment out** the API calls and return mock data

### Verify Your Setup

After adding your API key:

1. **Restart** your development server: `npm run dev`
2. **Test** the trading panel by searching for stocks
3. **Check** browser console for any remaining errors

### Free API Limits

- **Finnhub**: 60 calls/minute (recommended)
- **Alpha Vantage**: 25 calls/day, 5 calls/minute

The app includes smart caching to minimize API usage and stay within free limits.

### Need Help?

If you're still seeing API errors:

1. Check that your `.env` file is in the project root
2. Verify the API key is correct (no extra spaces)
3. Make sure you restarted the development server
4. Check the browser console for specific error messages

The database errors should be resolved after running the SQL migration, and the API errors will be fixed once you add a valid API key!