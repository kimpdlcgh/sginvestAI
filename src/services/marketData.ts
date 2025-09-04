interface QuoteData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  high?: number;
  low?: number;
  open?: number;
  previousClose?: number;
}

interface TickerData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

class MarketDataService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 60000; // 1 minute
  private readonly API_TIMEOUT = 10000; // 10 seconds
  private rateLimitReached = {
    finnhub: false,
    alphaVantage: false,
    resetTime: 0
  };

  private async fetchWithCache(url: string, cacheKey: string): Promise<any> {
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.API_TIMEOUT);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(`Rate limit exceeded (${response.status})`);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache successful response
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      
      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - API took too long to respond');
      }
      throw error;
    }
  }

  private async getQuoteFromFinnhub(symbol: string): Promise<QuoteData | null> {
    const apiKey = import.meta.env.VITE_FINNHUB_API_KEY;
    
    if (!apiKey || apiKey === 'your_finnhub_api_key' || this.rateLimitReached.finnhub) {
      return null;
    }

    try {
      const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;
      const data = await this.fetchWithCache(url, `finnhub_${symbol}`);
      
      if (!data || data.error || typeof data.c !== 'number') {
        return null;
      }

      return {
        symbol,
        price: data.c || 0,
        change: (data.c - data.pc) || 0,
        changePercent: data.pc ? ((data.c - data.pc) / data.pc * 100) : 0,
        volume: data.v,
        high: data.h,
        low: data.l,
        open: data.o,
        previousClose: data.pc
      };
    } catch (error) {
      console.warn(`Finnhub API error for ${symbol}:`, error.message);
      
      if (error.message.includes('Rate limit')) {
        this.rateLimitReached.finnhub = true;
        this.rateLimitReached.resetTime = Date.now() + 60000; // Reset after 1 minute
      }
      
      return null;
    }
  }

  private async getQuoteFromAlphaVantage(symbol: string): Promise<QuoteData | null> {
    const apiKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;
    
    if (!apiKey || apiKey === 'your_alpha_vantage_api_key' || this.rateLimitReached.alphaVantage) {
      return null;
    }

    try {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
      const data = await this.fetchWithCache(url, `alpha_${symbol}`);
      
      if (data.Note && data.Note.includes('rate limit')) {
        this.rateLimitReached.alphaVantage = true;
        this.rateLimitReached.resetTime = Date.now() + 86400000; // Reset after 24 hours
        return null;
      }

      const quote = data['Global Quote'];
      if (!quote || !quote['05. price']) {
        return null;
      }

      const price = parseFloat(quote['05. price']);
      const change = parseFloat(quote['09. change']);
      const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));

      return {
        symbol,
        price,
        change,
        changePercent,
        volume: parseInt(quote['06. volume']) || 0,
        high: parseFloat(quote['03. high']),
        low: parseFloat(quote['04. low']),
        open: parseFloat(quote['02. open']),
        previousClose: parseFloat(quote['08. previous close'])
      };
    } catch (error) {
      console.warn(`Alpha Vantage API error for ${symbol}:`, error.message);
      
      if (error.message.includes('rate limit') || error.message.includes('25 requests')) {
        this.rateLimitReached.alphaVantage = true;
        this.rateLimitReached.resetTime = Date.now() + 86400000; // Reset after 24 hours
      }
      
      return null;
    }
  }

  private getMockQuote(symbol: string): QuoteData {
    // Generate consistent mock data based on symbol
    const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random = (seed * 9301 + 49297) % 233280;
    const basePrice = 50 + (random / 233280) * 200; // Price between $50-$250
    const changePercent = -5 + (random / 233280) * 10; // Change between -5% to +5%
    const change = basePrice * (changePercent / 100);

    return {
      symbol,
      price: Math.round(basePrice * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      volume: Math.floor(1000000 + (random / 233280) * 5000000),
      high: Math.round((basePrice * 1.05) * 100) / 100,
      low: Math.round((basePrice * 0.95) * 100) / 100,
      open: Math.round((basePrice * 0.98) * 100) / 100,
      previousClose: Math.round((basePrice - change) * 100) / 100
    };
  }

  async getQuote(symbol: string): Promise<QuoteData> {
    // Reset rate limits if enough time has passed
    if (Date.now() > this.rateLimitReached.resetTime) {
      this.rateLimitReached.finnhub = false;
      this.rateLimitReached.alphaVantage = false;
    }

    // Try Finnhub first (better rate limits)
    try {
      const finnhubData = await this.getQuoteFromFinnhub(symbol);
      if (finnhubData) {
        return finnhubData;
      }
    } catch (error) {
      console.warn(`Finnhub failed for ${symbol}, trying Alpha Vantage...`);
    }

    // Try Alpha Vantage as fallback
    try {
      const alphaData = await this.getQuoteFromAlphaVantage(symbol);
      if (alphaData) {
        return alphaData;
      }
    } catch (error) {
      console.warn(`Alpha Vantage failed for ${symbol}, using mock data...`);
    }

    // Fallback to mock data
    console.info(`Using mock data for ${symbol} - API services unavailable`);
    return this.getMockQuote(symbol);
  }

  async searchSymbols(query: string): Promise<Array<{ symbol: string; name: string; type: string }>> {
    const apiKey = import.meta.env.VITE_FINNHUB_API_KEY;
    
    if (!apiKey || apiKey === 'your_finnhub_api_key') {
      // Return mock search results
      const mockResults = [
        { symbol: 'AAPL', name: 'Apple Inc.', type: 'Common Stock' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'Common Stock' },
        { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'Common Stock' },
        { symbol: 'TSLA', name: 'Tesla, Inc.', type: 'Common Stock' },
        { symbol: 'AMZN', name: 'Amazon.com, Inc.', type: 'Common Stock' }
      ];
      
      return mockResults.filter(stock => 
        stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
        stock.name.toLowerCase().includes(query.toLowerCase())
      );
    }

    try {
      const url = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${apiKey}`;
      const data = await this.fetchWithCache(url, `search_${query}`);
      
      if (!data || !data.result) {
        return [];
      }

      return data.result
        .filter((item: any) => item.type === 'Common Stock')
        .slice(0, 10)
        .map((item: any) => ({
          symbol: item.symbol,
          name: item.description,
          type: item.type
        }));
    } catch (error) {
      console.warn('Symbol search failed:', error.message);
      return [];
    }
  }

  async getTickerData(): Promise<TickerData[]> {
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA', 'META', 'NFLX'];
    
    try {
      const quotes = await Promise.allSettled(
        symbols.map(async (symbol) => {
          const quote = await this.getQuote(symbol);
          return {
            symbol: quote.symbol,
            name: this.getCompanyName(symbol),
            price: quote.price,
            change: quote.change,
            changePercent: quote.changePercent
          };
        })
      );

      return quotes
        .filter((result): result is PromiseFulfilledResult<TickerData> => result.status === 'fulfilled')
        .map(result => result.value);
    } catch (error) {
      console.warn('Ticker data fetch failed:', error.message);
      
      // Return mock ticker data as fallback
      return symbols.map(symbol => {
        const mockQuote = this.getMockQuote(symbol);
        return {
          symbol,
          name: this.getCompanyName(symbol),
          price: mockQuote.price,
          change: mockQuote.change,
          changePercent: mockQuote.changePercent
        };
      });
    }
  }

  private getCompanyName(symbol: string): string {
    const names: Record<string, string> = {
      'AAPL': 'Apple Inc.',
      'GOOGL': 'Alphabet Inc.',
      'MSFT': 'Microsoft Corp.',
      'TSLA': 'Tesla Inc.',
      'AMZN': 'Amazon.com Inc.',
      'NVDA': 'NVIDIA Corp.',
      'META': 'Meta Platforms Inc.',
      'NFLX': 'Netflix Inc.'
    };
    return names[symbol] || symbol;
  }

  getAPIStatus() {
    const finnhubKey = import.meta.env.VITE_FINNHUB_API_KEY;
    const alphaVantageKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;

    // Reset rate limits if enough time has passed
    if (Date.now() > this.rateLimitReached.resetTime) {
      this.rateLimitReached.finnhub = false;
      this.rateLimitReached.alphaVantage = false;
    }

    return {
      finnhub: {
        configured: !!(finnhubKey && finnhubKey !== 'your_finnhub_api_key'),
        rateLimited: this.rateLimitReached.finnhub,
        status: (!finnhubKey || finnhubKey === 'your_finnhub_api_key') ? 'not_configured' :
                this.rateLimitReached.finnhub ? 'rate_limited' : 'active'
      },
      alphaVantage: {
        configured: !!(alphaVantageKey && alphaVantageKey !== 'your_alpha_vantage_api_key'),
        rateLimited: this.rateLimitReached.alphaVantage,
        status: (!alphaVantageKey || alphaVantageKey === 'your_alpha_vantage_api_key') ? 'not_configured' :
                this.rateLimitReached.alphaVantage ? 'rate_limited' : 'active'
      },
      resetTime: this.rateLimitReached.resetTime
    };
  }
}

export const marketDataService = new MarketDataService();