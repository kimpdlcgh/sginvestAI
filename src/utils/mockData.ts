import { Asset, PortfolioStats, AIInsight, MarketNewsItem, ChartData } from '../types';

export const mockAssets: Asset[] = [
  {
    id: '1',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 178.25,
    change: 2.45,
    changePercent: 1.39,
    shares: 50,
    value: 8912.50,
    allocation: 35.2,
    sector: 'Technology'
  },
  {
    id: '2',
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    price: 138.42,
    change: -1.23,
    changePercent: -0.88,
    shares: 25,
    value: 3460.50,
    allocation: 13.7,
    sector: 'Technology'
  },
  {
    id: '3',
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    price: 341.87,
    change: 4.12,
    changePercent: 1.22,
    shares: 15,
    value: 5128.05,
    allocation: 20.3,
    sector: 'Technology'
  },
  {
    id: '4',
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    price: 189.34,
    change: -8.76,
    changePercent: -4.42,
    shares: 20,
    value: 3786.80,
    allocation: 15.0,
    sector: 'Automotive'
  },
  {
    id: '5',
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    price: 875.21,
    change: 15.67,
    changePercent: 1.82,
    shares: 5,
    value: 4376.05,
    allocation: 17.3,
    sector: 'Technology'
  }
];

export const mockPortfolioStats: PortfolioStats = {
  totalValue: 25663.90,
  totalGain: 3247.82,
  totalGainPercent: 14.48,
  dayChange: 234.67,
  dayChangePercent: 0.92
};

export const mockAIInsights: AIInsight[] = [
  {
    id: '1',
    type: 'buy',
    title: 'Strong Buy Signal for NVDA',
    description: 'Technical analysis shows bullish momentum with AI sector growth catalyst. RSI indicates oversold condition with potential 15% upside.',
    confidence: 87,
    impact: 'high',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    asset: 'NVDA'
  },
  {
    id: '2',
    type: 'alert',
    title: 'Portfolio Rebalancing Suggested',
    description: 'Technology allocation has grown to 86.2%. Consider diversifying into healthcare or finance sectors to reduce risk exposure.',
    confidence: 92,
    impact: 'medium',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2)
  },
  {
    id: '3',
    type: 'sell',
    title: 'Tesla Position Review',
    description: 'Recent volatility and production concerns suggest reducing TSLA exposure. Consider taking profits on 30% of position.',
    confidence: 74,
    impact: 'medium',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
    asset: 'TSLA'
  }
];

export const mockMarketNews: MarketNewsItem[] = [
  {
    id: '1',
    title: 'Fed Signals Potential Rate Cut in Q2',
    summary: 'Federal Reserve officials hint at monetary policy easing amid cooling inflation data.',
    sentiment: 'positive',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    source: 'Bloomberg'
  },
  {
    id: '2',
    title: 'Tech Earnings Season Shows Mixed Results',
    summary: 'Major technology companies report varied quarterly performance with AI investments driving growth.',
    sentiment: 'neutral',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.5),
    source: 'Reuters'
  },
  {
    id: '3',
    title: 'Energy Sector Faces Headwinds',
    summary: 'Oil prices decline as global demand concerns weigh on energy stocks.',
    sentiment: 'negative',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    source: 'CNBC'
  }
];

export const generateChartData = (days: number = 30): ChartData[] => {
  const data: ChartData[] = [];
  const baseValue = 22500;
  let currentValue = baseValue;
  
  for (let i = days; i >= 0; i--) {
    const timestamp = new Date();
    timestamp.setDate(timestamp.getDate() - i);
    
    // Simulate realistic market movement
    const volatility = 0.02;
    const trend = 0.001;
    const randomChange = (Math.random() - 0.5) * volatility;
    currentValue = currentValue * (1 + trend + randomChange);
    
    data.push({
      timestamp,
      value: Math.round(currentValue * 100) / 100
    });
  }
  
  return data;
};