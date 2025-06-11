# API Troubleshooting Guide

## Quick Fix for Current Errors

The application is showing API connection errors. Here's how to resolve them:

### 1. Finnhub API Connection Error

**Error:** "Network error - unable to connect to API"

**Cause:** Missing or invalid Finnhub API key

**Solution:**
1. Get a free API key from [Finnhub.io](https://finnhub.io/)
2. Add to your `.env` file:
   ```
   VITE_FINNHUB_API_KEY=your_actual_api_key_here
   ```
3. Restart your development server: `npm run dev`

### 2. Alpha Vantage Rate Limit

**Error:** "25 requests per day limit exceeded"

**Cause:** Free tier API limit reached

**Solution:**
- **Primary:** Fix Finnhub API (above) - it has much higher limits (60 calls/minute)
- **Alternative:** Wait 24 hours for Alpha Vantage limit to reset
- **Upgrade:** Get a paid Alpha Vantage plan for higher limits

## Current App Behavior

The app now includes smart fallback mechanisms:

✅ **Graceful Degradation:** Falls back to demo data when APIs fail
✅ **Rate Limit Detection:** Automatically switches to backup APIs
✅ **Error Recovery:** Continues working even with API issues
✅ **Status Indicators:** Shows whether you're seeing live or demo data

## API Status Indicators

- 🟢 **Live Data:** Real-time market data from APIs
- 🟡 **Demo Data:** Simulated data (APIs unavailable/rate limited)
- 🔴 **Error:** Temporary connection issues

## Recommended Setup

For the best experience:

1. **Get Finnhub API key** (primary - 60 calls/minute free)
2. **Get Alpha Vantage key** (backup - 25 calls/day free)
3. **Add both to .env file**
4. **Restart development server**

## Environment Variables Template

Create/update your `.env` file:

```env
# Supabase (required)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Market Data APIs (recommended)
VITE_FINNHUB_API_KEY=your_finnhub_api_key
VITE_ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key
```

## Testing Your Fix

After adding API keys:

1. **Restart server:** `npm run dev`
2. **Check ticker:** Top of page should show "Live Data"
3. **Test trading:** Search for stocks in Trading Panel
4. **Monitor console:** Should see fewer API errors

## Still Having Issues?

If you continue seeing errors:

1. **Verify API keys:** Check they're correct (no extra spaces)
2. **Check .env location:** Must be in project root directory
3. **Restart server:** Always restart after changing .env
4. **Check browser console:** Look for specific error messages
5. **Test API keys:** Try them directly in browser/Postman

## Demo Mode

The app works perfectly in demo mode if you prefer not to set up APIs:

- All features work with simulated data
- Portfolio tracking still functions
- Trading simulation available
- No API costs or limits

Just ignore the API setup if you want to use demo mode!

## Production Deployment

For production:

1. **Upgrade API plans** for higher limits
2. **Set environment variables** in your hosting platform
3. **Monitor API usage** to avoid overages
4. **Consider multiple API providers** for redundancy

The app is designed to handle API failures gracefully, so your users will always have a working experience even if APIs go down temporarily.