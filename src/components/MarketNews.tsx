import React from 'react';
import { Newspaper, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { MarketNewsItem } from '../types';

interface MarketNewsProps {
  news: MarketNewsItem[];
}

export const MarketNews: React.FC<MarketNewsProps> = ({ news }) => {
  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (minutes < 60) {
      return `${minutes}m ago`;
    } else {
      return `${hours}h ago`;
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="w-3.5 h-3.5 text-green-400" />;
      case 'negative':
        return <TrendingDown className="w-3.5 h-3.5 text-red-400" />;
      default:
        return <Minus className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-400';
      case 'negative':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-purple-500/10 rounded-lg">
          <Newspaper className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">Market News</h2>
          <p className="text-xs text-slate-400">Latest market updates</p>
        </div>
      </div>

      <div className="space-y-3">
        {news.map((article) => (
          <div 
            key={article.id}
            className="border border-slate-700/50 rounded-lg p-3 hover:bg-slate-700/20 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-white text-sm leading-tight flex-1 mr-3">
                {article.title}
              </h3>
              <div className="flex items-center space-x-1 text-xs text-slate-400 flex-shrink-0">
                <Clock className="w-3 h-3" />
                <span>{formatTime(article.timestamp)}</span>
              </div>
            </div>
            
            <p className="text-xs text-slate-300 mb-2 leading-relaxed">
              {article.summary}
            </p>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{article.source}</span>
              <div className="flex items-center space-x-1">
                {getSentimentIcon(article.sentiment)}
                <span className={`text-xs capitalize ${getSentimentColor(article.sentiment)}`}>
                  {article.sentiment}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};