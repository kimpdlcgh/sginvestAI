import React from 'react';
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Target } from 'lucide-react';
import { AIInsight } from '../types';

interface AIInsightsProps {
  insights: AIInsight[];
}

export const AIInsights: React.FC<AIInsightsProps> = ({ insights }) => {
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

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'buy':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'sell':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      default:
        return <Target className="w-4 h-4 text-blue-400" />;
    }
  };

  const getInsightBorder = (type: string) => {
    switch (type) {
      case 'buy':
        return 'border-green-500/20 bg-green-500/5';
      case 'sell':
        return 'border-red-500/20 bg-red-500/5';
      case 'alert':
        return 'border-yellow-500/20 bg-yellow-500/5';
      default:
        return 'border-blue-500/20 bg-blue-500/5';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-400';
    if (confidence >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <Brain className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">AI Insights</h2>
          <p className="text-xs text-slate-400">Powered by advanced analytics</p>
        </div>
      </div>

      <div className="space-y-3">
        {insights.map((insight) => (
          <div 
            key={insight.id}
            className={`border rounded-lg p-3 transition-all duration-200 hover:scale-[1.01] ${getInsightBorder(insight.type)}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getInsightIcon(insight.type)}
                <div>
                  <h3 className="font-semibold text-white text-sm">{insight.title}</h3>
                  {insight.asset && (
                    <span className="text-xs text-slate-400">{insight.asset}</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className={`text-xs font-medium ${getConfidenceColor(insight.confidence)}`}>
                  {insight.confidence}% confidence
                </p>
                <p className="text-xs text-slate-400">{formatTime(insight.timestamp)}</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-300 mb-2 leading-relaxed">{insight.description}</p>
            
            <div className="flex items-center justify-between">
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                insight.impact === 'high' ? 'bg-red-500/20 text-red-400' :
                insight.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-green-500/20 text-green-400'
              }`}>
                {insight.impact} impact
              </span>
              
              <div className="w-20 bg-slate-700 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full ${getConfidenceColor(insight.confidence).includes('green') ? 'bg-green-400' : 
                    getConfidenceColor(insight.confidence).includes('yellow') ? 'bg-yellow-400' : 'bg-red-400'}`}
                  style={{ width: `${insight.confidence}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};