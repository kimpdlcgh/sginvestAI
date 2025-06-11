export interface Asset {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  shares: number;
  value: number;
  allocation: number;
  sector: string;
  logo?: string;
}

export interface PortfolioStats {
  totalValue: number;
  totalGain: number;
  totalGainPercent: number;
  dayChange: number;
  dayChangePercent: number;
}

export interface AIInsight {
  id: string;
  type: 'buy' | 'sell' | 'hold' | 'alert';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  timestamp: Date;
  asset?: string;
}

export interface MarketNewsItem {
  id: string;
  title: string;
  summary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  timestamp: Date;
  source: string;
}

export interface ChartData {
  timestamp: Date;
  value: number;
}