# API Configuration Guide

## Market Data APIs Setup

This guide will help you configure your API keys for real-time market data.

### 1. Alpha Vantage API

**Best for:** US stocks, forex, commodities
**Free tier:** 25 requests/day, 5 requests/minute

1. Go to [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
2. Sign up for a free account
3. Get your API key
4. Add to `.env`: `VITE_ALPHA_VANTAGE_API_KEY=your_key_here`

### 2. Finnhub API

**Best for:** Real-time stock data, better rate limits
**Free tier:** 60 calls/minute

1. Go to [Finnhub](https://finnhub.io/)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Add to `.env`: `VITE_FINNHUB_API_KEY=your_key_here`

### 3. Fixer.io API

**Best for:** Forex exchange rates
**Free tier:** 100 requests/month

1. Go to [Fixer.io](https://fixer.io/)
2. Sign up for a free account
3. Get your API key
4. Add to `.env`: `VITE_FIXER_API_KEY=your_key_here`

## Environment Variables Setup

Create a `.env` file in your project root with:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Market Data APIs
VITE_ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key
VITE_FINNHUB_API_KEY=your_finnhub_api_key
VITE_FIXER_API_KEY=your_fixer_api_key
```

## API Priority & Fallback System

The app uses a smart fallback system:

1. **Primary:** Finnhub (better rate limits)
2. **Secondary:** Alpha Vantage (comprehensive data)
3. **Tertiary:** Fixer.io (forex only)
4. **Fallback:** Mock data (for development)

## Rate Limit Management

- **Caching:** 1-minute cache for all API responses
- **Smart routing:** Different APIs for different asset types
- **Graceful degradation:** Falls back to mock data if APIs fail

## Testing Your Setup

1. Add your API keys to `.env`
2. Restart your development server: `npm run dev`
3. Try searching for stocks in the Trading Panel
4. Check browser console for any API errors

## Troubleshooting

### Common Issues:

1. **"API key not found"** - Check your `.env` file
2. **"Rate limit exceeded"** - Wait or upgrade your API plan
3. **"CORS errors"** - APIs should work from localhost
4. **"Invalid response"** - Check API key validity

### Debug Mode:

Enable debug logging by adding to your `.env`:
```env
VITE_DEBUG_API=true
```

## Production Considerations

For production deployment:

1. **Upgrade API plans** for higher rate limits
2. **Use environment variables** in your hosting platform
3. **Monitor API usage** to avoid overages
4. **Consider API key rotation** for security

## Alternative APIs (Optional)

If you need additional data sources:

- **IEX Cloud:** `VITE_IEX_CLOUD_API_KEY`
- **Polygon.io:** `VITE_POLYGON_API_KEY`
- **Twelve Data:** `VITE_TWELVE_DATA_API_KEY`

## Market Data Coverage

With the configured APIs, you'll have access to:

✅ **50+ US Stocks** - Real-time quotes and search
✅ **10 Forex Pairs** - Live exchange rates
✅ **15 Commodities** - Gold, oil, agricultural products
✅ **15 Cryptocurrencies** - Bitcoin, Ethereum, altcoins
✅ **6 Bonds** - US Treasuries, international bonds

The app will automatically use the best available data source for each asset type!